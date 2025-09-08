/**
 * Search Pattern Matcher
 *
 * Configurable search pattern matching system
 */

import searchPatternsConfig from '@intake24/api/config/search-patterns.json';

export interface WildcardPattern {
  type: 'prefix' | 'suffix' | 'contains';
  field: string;
  template: string;
  boost: number;
  comment?: string;
}

export interface SearchStrategy {
  wildcard: {
    enabled: boolean;
    patterns?: WildcardPattern[];
  };
  minScore: number;
  rescoreBoost: number;
}

export interface SearchPattern {
  id: string;
  description: string;
  triggers: string[];
  strategies: SearchStrategy;
}

export interface SearchPatternConfig {
  patterns: SearchPattern[];
  defaultStrategy: SearchStrategy;
}

export class SearchPatternMatcher {
  private patterns: SearchPattern[];
  private defaultStrategy: SearchStrategy;
  private triggerMap: Map<string, SearchPattern>;

  constructor(config?: SearchPatternConfig) {
    const configToUse = config || searchPatternsConfig as SearchPatternConfig;
    this.patterns = configToUse.patterns;
    this.defaultStrategy = configToUse.defaultStrategy;

    // Build a trigger map for fast lookup
    this.triggerMap = new Map();
    for (const pattern of this.patterns) {
      for (const trigger of pattern.triggers) {
        this.triggerMap.set(trigger, pattern);
      }
    }
  }

  /**
   * Convert hiragana to katakana for better matching with indexed content
   * This handles cases where users type in hiragana but content is in katakana
   */
  private hiraganaToKatakana(text: string): string {
    return text.replace(/[\u3041-\u3096]/g, (match) => {
      // Convert hiragana (3041-3096) to katakana (30A1-30F6)
      return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
  }

  /**
   * Find matching pattern for a query
   */
  findPattern(query: string): SearchPattern | null {
    const q = (query || '').trim().normalize('NFKC');
    const qLower = q.toLowerCase();
    // Direct trigger match
    const direct = this.triggerMap.get(q);
    if (direct)
      return direct;

    // Japanese fallback: try katakana conversion for hiragana queries
    const katakana = this.hiraganaToKatakana(q);
    if (katakana !== q) {
      const directK = this.triggerMap.get(katakana);
      if (directK)
        return directK;
    }

    // Fallback: if query contains any trigger substring (in either form, case-insensitive), use that pattern
    for (const pattern of this.patterns) {
      for (const trigger of pattern.triggers) {
        const tLower = (trigger || '').toLowerCase();
        if (
          q === trigger ||
          qLower === tLower ||
          q.includes(trigger) ||
          qLower.includes(tLower) ||
          (katakana !== q && katakana.includes(trigger))
        ) {
          return pattern;
        }
      }
    }
    return null;
  }

  /**
   * Get search strategy for a query
   */
  getStrategy(query: string): SearchStrategy {
    const pattern = this.findPattern(query);
    return pattern ? pattern.strategies : this.defaultStrategy;
  }

  /**
   * Build wildcard clauses based on pattern configuration
   */
  buildWildcardClauses(query: string): any[] {
    const strategy = this.getStrategy(query);

    if (!strategy.wildcard.enabled || !strategy.wildcard.patterns) {
      return [];
    }

    return strategy.wildcard.patterns.map((pattern) => {
      const value = pattern.template.replace('{query}', query);

      if (pattern.type === 'prefix' || pattern.type === 'suffix' || pattern.type === 'contains') {
        // For prefix, use the prefix query type when possible
        if (pattern.type === 'prefix' && value.endsWith('*')) {
          return {
            prefix: {
              [pattern.field]: {
                value: value.slice(0, -1), // Remove the * for prefix query
                boost: pattern.boost,
              },
            },
          };
        }

        // For suffix and contains, use wildcard
        return {
          wildcard: {
            [pattern.field]: {
              value,
              boost: pattern.boost,
            },
          },
        };
      }

      return null;
    }).filter(clause => clause !== null);
  }

  /**
   * Get minimum score threshold for a query
   */
  getMinScore(query: string): number {
    const strategy = this.getStrategy(query);
    return strategy.minScore;
  }

  /**
   * Get rescore boost for a query
   */
  getRescoreBoost(query: string): number {
    const strategy = this.getStrategy(query);
    return strategy.rescoreBoost;
  }

  /**
   * Build complete search query with pattern matching
   */
  buildSearchQuery(query: string, options: {
    size?: number;
    from?: number;
    isJapanese?: boolean;
  } = {}): any {
    const { size = 20, from = 0, isJapanese = false } = options;

    // For Japanese searches, also create a katakana version of the query
    // This handles cases where users type in hiragana (びーる) but content is in katakana (ビール)
    const katakanaQuery = isJapanese ? this.hiraganaToKatakana(query) : query;
    const hasHiragana = isJapanese && query !== katakanaQuery;

    const charLen = [...query].length;
    const pattern = this.findPattern(query);

    // Base query clauses that apply to all searches
    const baseClauses = [
      // Priority 1: Exact match (highest boost)
      {
        term: {
          // Use keyword field for true exact match (no analyzer)
          'name.keyword': {
            value: query,
            boost: 50,
          },
        },
      },
      // Priority 2: Exact phrase match - reduced boost for Japanese due to analyzer issues
      {
        match_phrase: {
          name: {
            query,
            boost: isJapanese ? 5 : 30, // Reduced for Japanese
          },
        },
      },
      // Priority 3: All terms must match (AND) - reduced boost for Japanese
      {
        match: {
          name: {
            query,
            operator: 'AND',
            boost: isJapanese ? 3 : 20, // Reduced for Japanese
          },
        },
      },
      // Priority 4: Standard match - reduced boost for Japanese
      {
        match: {
          name: {
            query,
            minimum_should_match: '85%',
            boost: isJapanese ? 2 : 15, // Reduced for Japanese
          },
        },
      },
      // Priority 5: Multi-match - reduced boost for Japanese due to analyzer issues
      {
        multi_match: {
          query,
          fields: isJapanese
            ? ['name^3', 'name.katakana^2.5', 'name.ngram^2', 'brand_names^2', 'description']
            : ['name^3', 'brand_names^2', 'description'],
          type: 'best_fields',
          boost: isJapanese ? 2 : 10, // Significantly reduced for Japanese
        },
      },
    ];

    // Add pattern-specific wildcard clauses
    const wildcardClauses = this.buildWildcardClauses(query);
    const allClauses = [...baseClauses, ...wildcardClauses];

    // For Japanese: Add enhanced matching for better compound word support
    if (isJapanese) {
      // Check if query contains katakana
      const hasKatakana = /[\u30A0-\u30FF]/.test(query);

      // For katakana queries, prioritize wildcard matching due to analyzer issues
      if (hasKatakana) {
        // Primary: Wildcard for exact substring matching (most reliable)
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${query}*`,
              boost: 35,
            },
          },
        });

        // Secondary: Prefix matching for compounds
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${query}`,
              boost: 30,
            },
          },
        });
      }

      // Add katakana field search if available (after reindexing)
      allClauses.push({
        match: {
          'name.katakana': {
            query,
            boost: 15,
            // No analyzer specified - use the field's configured analyzer
          },
        },
      });

      // For BEER queries, narrow multi_match fields to reduce noise from description/others
      if (pattern?.id === 'beer') {
        const mmIndex = allClauses.findIndex((c: any) => c?.multi_match?.fields);
        if (mmIndex >= 0) {
          allClauses[mmIndex] = {
            multi_match: {
              query,
              fields: ['name^4', 'name.katakana^3', 'brand_names^2'],
              type: 'best_fields',
              boost: 2,
              // Don't specify analyzer - let the field's configured search_analyzer be used
            },
          } as any;
        }
      }

      // If user typed in hiragana, convert to katakana and search
      if (hasHiragana) {
        // Add wildcard search for the katakana version (most reliable)
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${katakanaQuery}*`,
              boost: 35,
            },
          },
        });

        // Also try prefix matching
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${katakanaQuery}`,
              boost: 30,
            },
          },
        });

        // Also search katakana field with katakana query (after reindexing)
        allClauses.push({
          match: {
            'name.katakana': {
              query: katakanaQuery,
              boost: 20,
            },
          },
        });
      }

      // For short queries (2-3 characters), add additional matching strategies
      if (charLen <= 3 && charLen >= 2) {
        // Use ngram field for substring matching
        allClauses.push({
          match: {
            'name.ngram': {
              query,
              boost: 12,
            },
          },
        });

        // Also add prefix matching for Japanese short queries
        allClauses.push({
          prefix: {
            'name.keyword': {
              value: query,
              boost: 8,
            },
          },
        });
      }
    }

    // Include substring field for compound word matching when available
    // Note: Requires 'name.substring' field to be indexed
    if (!isJapanese && charLen >= 3) {
      allClauses.push({
        match: {
          'name.substring': {
            query,
            boost: 8,
          },
        },
      });
    }

    // Explicitly promote 中華まん when searching for 中華
    const p = this.findPattern(query);
    if (p?.id === 'chinese') {
      allClauses.push({
        match_phrase: {
          name: {
            query: '中華まん',
            boost: 20,
          },
        },
      });
    }

    const rescoreBoost = this.getRescoreBoost(query);

    // Pattern-specific hard constraints for beer to guarantee relevance
    let beerMust: any | null = null;
    let beerMustNot: any[] = [];
    if (pattern?.id === 'beer') {
      beerMust = {
        bool: {
          should: [
            { wildcard: { 'name.keyword': { value: '*ビール*' } } },
            { wildcard: { 'name.keyword': { value: '*麦酒*' } } },
            { wildcard: { 'name.keyword': { value: '*発泡酒*' } } },
            { wildcard: { 'name.keyword': { value: '*ビア*' } } },
          ],
          minimum_should_match: 1,
        },
      };
      const notBeerTerms = [
        '*ビーフ*',
        '*コンビーフ*',
        '*ビーフン*',
        '*ビーンズ*',
        '*ベイクドビーンズ*',
        '*ゼリービーンズ*',
        '*ビーツ*',
        '*ピーナッツ*',
        '*ベビー*',
        '*ビーガン*',
        '*ビーノ*',
      ];
      beerMustNot = notBeerTerms.map(value => ({ wildcard: { 'name.keyword': { value } } }));
    }

    // Build function_score functions with optional dev-only penalties
    const functions: any[] = [
      {
        field_value_factor: {
          field: 'popularity',
          missing: 0,
          factor: 0.15,
          modifier: 'log1p',
        },
      },
    ];

    // Boost adjustments for Chinese query relevance
    // NOTE: OpenSearch doesn't support negative weights in function_score
    // Instead, we boost relevant items and rely on relative scoring
    if (pattern?.id === 'chinese') {
      // Boost authentic Chinese dishes to improve relevance
      const boostTerms = [
        { value: '冷やし中華', weight: 10.0 }, // Explicitly boost hiyashi chuka
        { value: '中華まん', weight: 8.0 }, // Boost Chinese steamed buns
        { value: '麻婆', weight: 6.0 }, // Boost mapo dishes
        { value: '餃子', weight: 5.0 }, // Boost gyoza/dumplings
        { value: '炒飯', weight: 5.0 }, // Boost fried rice
        { value: '担々麺', weight: 5.0 }, // Boost tantanmen
      ];

      for (const b of boostTerms) {
        functions.push({
          filter: { wildcard: { 'name.keyword': { value: `*${b.value}*` } } },
          weight: b.weight,
        });
      }
    }

    // Build the core bool query
    const coreBool: any = { should: allClauses, minimum_should_match: 1 };
    if (beerMust)
      coreBool.must = coreBool.must ? coreBool.must.concat(beerMust) : [beerMust];
    if (beerMustNot.length > 0)
      coreBool.must_not = coreBool.must_not ? coreBool.must_not.concat(beerMustNot) : beerMustNot;

    return {
      size,
      from,
      query: {
        function_score: {
          query: { bool: coreBool },
          // Boost by popularity and apply optional penalties
          functions,
          score_mode: 'sum',
          boost_mode: 'sum',
        },
      },
      // Rescore to ensure exact matches are at the top
      rescore: {
        window_size: 100,
        query: {
          rescore_query: {
            bool: {
              should: [
                // Heavily boost exact phrase matches with Japanese analyzer
                { match_phrase: { name: { query, boost: 5 } } },
                // Also boost items that end with the search term
                {
                  wildcard: {
                    'name.keyword': {
                      value: `*${query}`,
                      boost: 3,
                    },
                  },
                },
                // For Japanese, boost items containing the exact term in katakana field
                ...(isJapanese
                  ? [
                      { match: { name: { query, boost: 4 } } },
                      {
                        match: {
                          'name.katakana': {
                            query,
                            boost: 5,
                          },
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          query_weight: 1,
          rescore_query_weight: rescoreBoost,
        },
      },
      // Add minimum score threshold to filter out noise
      // Use pattern-driven minScore; avoid overly strict katakana threshold
      min_score: this.getMinScore(query),
      // Highlight matching terms
      highlight: {
        fields: {
          name: {
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
          },
          brand_names: {
            fragment_size: 150,
          },
        },
      },
    };
  }

  /**
   * Get all configured patterns (for debugging/admin purposes)
   */
  getAllPatterns(): SearchPattern[] {
    return this.patterns;
  }

  /**
   * Add or update a pattern dynamically
   */
  addPattern(pattern: SearchPattern): void {
    // Remove existing pattern with same id if it exists
    this.patterns = this.patterns.filter(p => p.id !== pattern.id);
    this.patterns.push(pattern);

    // Update trigger map
    for (const trigger of pattern.triggers) {
      this.triggerMap.set(trigger, pattern);
    }
  }

  /**
   * Remove a pattern by id
   */
  removePattern(id: string): void {
    const pattern = this.patterns.find(p => p.id === id);
    if (pattern) {
      // Remove from trigger map
      for (const trigger of pattern.triggers) {
        this.triggerMap.delete(trigger);
      }
      // Remove from patterns array
      this.patterns = this.patterns.filter(p => p.id !== id);
    }
  }
}
