/**
 * Search Pattern Matcher
 *
 * Configurable search pattern matching system
 */

import opensearchConfig from '@intake24/api/config/opensearch';
import searchPatternsConfig from '@intake24/api/config/search-patterns.json';
import { normalizeForSearch, normalizeJapaneseText, toHiragana, toKatakana } from '@intake24/api/utils/japanese-normalizer';

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
  private readonly synonymCanonicalMap: Map<string, string>;

  constructor(config?: SearchPatternConfig) {
    const configToUse = config || searchPatternsConfig as SearchPatternConfig;
    this.patterns = configToUse.patterns;
    this.defaultStrategy = configToUse.defaultStrategy;

    // Build a trigger map for fast lookup
    this.triggerMap = new Map();
    for (const pattern of this.patterns) {
      for (const trigger of pattern.triggers) {
        this.triggerMap.set(trigger, pattern);

        const normalizedTrigger = normalizeJapaneseText(trigger);
        if (normalizedTrigger && normalizedTrigger !== trigger)
          this.triggerMap.set(normalizedTrigger, pattern);

        const hiraganaTrigger = this.katakanaToHiragana(trigger);
        if (hiraganaTrigger && !this.triggerMap.has(hiraganaTrigger))
          this.triggerMap.set(hiraganaTrigger, pattern);

        const katakanaTrigger = this.hiraganaToKatakana(trigger);
        if (katakanaTrigger && !this.triggerMap.has(katakanaTrigger))
          this.triggerMap.set(katakanaTrigger, pattern);
      }
    }

    this.synonymCanonicalMap = this.buildSynonymCanonicalMap();
  }

  /**
   * Convert hiragana to katakana for better matching with indexed content
   * This handles cases where users type in hiragana but content is in katakana
   */
  private hiraganaToKatakana(text: string): string {
    return toKatakana(text);
  }

  private katakanaToHiragana(text: string): string {
    return toHiragana(text);
  }

  private buildSynonymCanonicalMap(): Map<string, string> {
    const map = new Map<string, string>();

    const synonymLists: string[] = (opensearchConfig as any)?.japaneseIndexSettingsSudachi?.settings?.analysis?.filter?.synonym_graph_filter?.synonyms
      ?? (opensearchConfig as any)?.japaneseIndexSettings?.settings?.analysis?.filter?.synonym_graph_filter?.synonyms
      ?? [];

    for (const entry of synonymLists) {
      if (!entry)
        continue;

      const variants = entry.split(',').map(token => token.trim()).filter(Boolean);
      if (variants.length === 0)
        continue;

      const canonical = normalizeJapaneseText(variants[0]);

      for (const variant of variants) {
        const normalizedVariant = normalizeJapaneseText(variant);
        if (normalizedVariant && !map.has(normalizedVariant))
          map.set(normalizedVariant, canonical);

        // Also register katakana/hiragana normalized forms to improve lookups
        const kanaVariant = normalizedVariant ? this.hiraganaToKatakana(this.katakanaToHiragana(normalizedVariant)) : normalizedVariant;
        if (kanaVariant && !map.has(kanaVariant))
          map.set(kanaVariant, canonical);
      }
    }

    return map;
  }

  private resolveCanonicalSynonym(query: string): string | null {
    const normalizedQuery = normalizeJapaneseText(query);
    const direct = normalizedQuery ? this.synonymCanonicalMap.get(normalizedQuery) : null;
    if (direct)
      return direct;

    const hiragana = this.katakanaToHiragana(normalizedQuery);
    const hiraganaCanonical = this.synonymCanonicalMap.get(hiragana);
    if (hiraganaCanonical)
      return hiraganaCanonical;

    const katakana = this.hiraganaToKatakana(normalizedQuery);
    const katakanaCanonical = this.synonymCanonicalMap.get(katakana);
    if (katakanaCanonical)
      return katakanaCanonical;

    return null;
  }

  /**
   * Find matching pattern for a query
   */
  findPattern(query: string): SearchPattern | null {
    const q = normalizeJapaneseText(query || '');
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

    const normalized = normalizeForSearch(query || '');

    // For Japanese searches, also create canonical script variants of the query
    const searchQuery = isJapanese ? normalized.normalized : (query || '').trim();
    const katakanaQuery = isJapanese ? normalized.katakana : searchQuery;
    const hiraganaQuery = isJapanese ? normalized.hiragana : searchQuery;
    const hasHiragana = isJapanese && searchQuery !== katakanaQuery;

    // Detect if query is romaji (Latin alphabet)
    const isRomaji = isJapanese && /^[a-z0-9\s\-/()（）%％]+$/i.test(searchQuery);

    const charLen = [...searchQuery].length;
    const pattern = this.findPattern(searchQuery);
    const hasKatakana = /[\u30A0-\u30FF]/.test(searchQuery);
    const canonicalSynonym = isJapanese ? this.resolveCanonicalSynonym(searchQuery) : null;

    // Base query clauses that apply to all searches
    const baseClauses = [
      // Priority 1: Exact match (highest boost)
      {
        term: {
          // Use keyword field for true exact match (no analyzer)
          'name.keyword': {
            value: searchQuery,
            boost: 30, // Reduced from 50 for better boost hierarchy
          },
        },
      },
      // Priority 2: Exact phrase match - balanced boost across languages
      {
        match_phrase: {
          name: {
            query: searchQuery,
            boost: 25, // Balanced boost for all languages (was: isJapanese ? 5 : 30)
          },
        },
      },
      // Priority 3: All terms must match (AND) - improved boost for Japanese
      {
        match: {
          name: {
            query: searchQuery,
            operator: 'AND',
            boost: isJapanese ? 12 : 18, // Improved from 1 to 12 for Japanese
          },
        },
      },
      // Priority 4: Standard match - improved boost for Japanese
      {
        match: {
          name: {
            query: searchQuery,
            minimum_should_match: '85%',
            boost: isJapanese ? 10 : 15, // Improved from 0.5 to 10 for Japanese
          },
        },
      },
      // Priority 5: Multi-match - heavily reduced boost for Japanese due to morpheme tokenization
      // Note: name.ngram removed from general multi_match to prevent character-level partial matches
      // It's now only used for short queries (2-3 chars) where substring matching is beneficial
      // For Japanese, morpheme-based fields (name, name.reading) have very low boosts to prevent single-morpheme matches
      {
        multi_match: {
          query: searchQuery,
          fields: isJapanese
            ? ['name^2', 'name_romaji^4', 'name.reading^2', 'name.katakana^3', 'name_synonyms^3.5', 'name_variants^2.5', 'brand_names^1', 'description^0.5']
            : ['name^3', 'brand_names^2', 'description'],
          type: 'best_fields',
          boost: isJapanese ? 2 : 10, // Heavily reduced for Japanese to prevent morpheme-level noise
        },
      },
    ];

    if (isJapanese && searchQuery) {
      baseClauses.push({
        term: {
          name_normalized: {
            value: searchQuery,
            boost: 28,
          },
        },
      } as any);

      const containsKana = /[\u3040-\u30FF]/.test(searchQuery);

      if (containsKana) {
        baseClauses.push({
          term: {
            'name_hiragana.keyword': {
              value: hiraganaQuery,
              boost: 26,
            },
          },
        } as any);

        baseClauses.push({
          term: {
            'name_katakana.keyword': {
              value: katakanaQuery,
              boost: 24,
            },
          },
        } as any);

        baseClauses.push({
          term: {
            'name_variants.keyword': {
              value: hiraganaQuery,
              boost: 20,
            },
          },
        } as any);

        baseClauses.push({
          term: {
            'name_variants.keyword': {
              value: katakanaQuery,
              boost: 19,
            },
          },
        } as any);

        baseClauses.push({
          term: {
            'name_synonyms.keyword': {
              value: hiraganaQuery,
              boost: 21,
            },
          },
        } as any);

        baseClauses.push({
          term: {
            'name_synonyms.keyword': {
              value: katakanaQuery,
              boost: 21,
            },
          },
        } as any);
      }

      baseClauses.push({
        match_phrase: {
          name_variants: {
            query: searchQuery,
            boost: 18,
          },
        },
      } as any);

      baseClauses.push({
        match: {
          name_variants: {
            query: searchQuery,
            operator: 'AND',
            boost: 14,
          },
        },
      } as any);

      baseClauses.push({
        match_phrase: {
          name_synonyms: {
            query: searchQuery,
            boost: 20,
          },
        },
      } as any);

      baseClauses.push({
        term: {
          'name_synonyms.keyword': {
            value: searchQuery,
            boost: 22,
          },
        },
      } as any);
    }

    // DEBUG: Log query details for Japanese searches
    if (isJapanese) {
      console.log('[SEARCH DEBUG] Japanese query:', searchQuery, 'charLen:', charLen, 'hasHiragana:', hasHiragana);
      const matchedPattern = this.findPattern(searchQuery);
      console.log('[SEARCH DEBUG] Matched pattern:', matchedPattern ? matchedPattern.id : 'defaultStrategy');
    }

    // Add pattern-specific wildcard clauses
    const wildcardClauses = this.buildWildcardClauses(searchQuery);
    if (isJapanese) {
      console.log('[SEARCH DEBUG] Wildcard clauses count:', wildcardClauses.length);
      if (wildcardClauses.length > 0) {
        console.log('[SEARCH DEBUG] First wildcard:', JSON.stringify(wildcardClauses[0]));
      }
    }
    const allClauses = [...baseClauses, ...wildcardClauses];

    // For Japanese: Add enhanced matching for better compound word support
    if (isJapanese) {
      // Special handling for romaji queries
      if (isRomaji) {
        // Boost romaji field heavily for romaji queries
        allClauses.push({
          match: {
            name_romaji: {
              query: searchQuery,
              boost: 22, // Balanced boost for direct romaji matching (was 40)
              operator: 'AND',
            },
          },
        });

        // Also try fuzzy matching for romaji (handles minor typos)
        allClauses.push({
          match: {
            name_romaji: {
              query: searchQuery,
              boost: 18, // Reduced from 25 for better balance
              fuzziness: 'AUTO',
            },
          },
        });

        // Reading field might also contain romaji-like representations
        allClauses.push({
          match: {
            'name.reading': {
              query: searchQuery,
              boost: 15, // Reduced from 20 for better hierarchy
            },
          },
        });

        allClauses.push({
          match: {
            name_synonyms: {
              query: searchQuery,
              boost: 16,
            },
          },
        } as any);
      }
      // For katakana queries, prioritize wildcard matching due to analyzer issues
      if (hasKatakana) {
        // CRITICAL: Add exact term match on brand_names
        allClauses.push({
          term: {
            'brand_names.keyword': {
              value: searchQuery,
              boost: 100, // Highest boost for exact brand name matches
            },
          },
        });

        // Primary: Wildcard for exact substring matching (most reliable)
        // CRITICAL: High boost to prioritize exact phrase/substring matches
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${searchQuery}*`,
              boost: 80, // Dramatically increased from 20 to dominate morpheme matches
            },
          },
        });

        // Secondary: Prefix matching for compounds
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${searchQuery}`,
              boost: 70, // Increased from 18
            },
          },
        });

        // IMPROVEMENT: Add prefix wildcard for partial matching
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `${searchQuery}*`, // Prefix match for compound words
              boost: 75, // Increased from 20
            },
          },
        });
      }

      if (canonicalSynonym) {
        // Ensure canonical term gets high weight in substring matches as well
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${canonicalSynonym}*`,
              boost: 20, // Reduced from 32 for consistency
            },
          },
        });

        allClauses.push({
          term: {
            'name_synonyms.keyword': {
              value: canonicalSynonym,
              boost: 24,
            },
          },
        } as any);
      }

      // Add katakana field search if available (after reindexing)
      allClauses.push({
        match: {
          'name.katakana': {
            query: searchQuery,
            boost: 15, // Keep at 15 for standard katakana field matching
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
              query: searchQuery,
              fields: ['name^4', 'name_romaji^4.5', 'name.reading^3.5', 'name.katakana^3', 'brand_names^2'],
              type: 'best_fields',
              boost: 2,
              // Don't specify analyzer - let the field's configured search_analyzer be used
            },
          } as any;
        }
      }

      // IMPROVEMENT (Priority 2A & 2B): Bidirectional kana matching with fuzzy support
      if (hasHiragana) {
        // CRITICAL: Add exact term match on brand_names for foods with alternative spellings
        // Example: "みそしる" query matches brand_name "みそしる" in instant miso soup
        allClauses.push({
          term: {
            'brand_names.keyword': {
              value: hiraganaQuery,
              boost: 100, // Highest boost for exact brand name matches
            },
          },
        });

        // Also match katakana version in brand_names
        allClauses.push({
          term: {
            'brand_names.keyword': {
              value: katakanaQuery,
              boost: 100,
            },
          },
        });

        // Preserve wildcard matches for the original hiragana input to support mixed-script documents
        // CRITICAL: High boost to prioritize exact phrase/substring matches over morpheme-level matches
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${hiraganaQuery}*`,
              boost: 80, // Dramatically increased from 20 to dominate morpheme matches
            },
          },
        });

        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${hiraganaQuery}`,
              boost: 70, // Increased from 18
            },
          },
        });

        // Add prefix wildcard for compound words
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `${hiraganaQuery}*`, // Prefix match
              boost: 75, // Increased from 20
            },
          },
        });

        // Add wildcard search for the katakana version (most reliable)
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${katakanaQuery}*`,
              boost: 85, // Increased from 22 - highest boost for cross-script matching
            },
          },
        });

        // Also try prefix matching for katakana
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `*${katakanaQuery}`,
              boost: 72, // Increased from 20
            },
          },
        });

        // Add prefix wildcard for katakana compounds
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `${katakanaQuery}*`, // Prefix match
              boost: 78, // Increased from 22
            },
          },
        });

        // Also search katakana field with katakana query (after reindexing)
        allClauses.push({
          match: {
            'name.katakana': {
              query: katakanaQuery,
              boost: 18, // Reduced from 20
            },
          },
        });

        // NEW: Add fuzzy matching for long hiragana queries (handles typos like "おうるすぱいす")
        if (charLen > 6) {
          allClauses.push({
            match: {
              name: {
                query: hiraganaQuery,
                fuzziness: 'AUTO', // Allows 1-2 character differences
                boost: 10,
              },
            },
          });

          // Also try fuzzy matching with katakana conversion
          allClauses.push({
            match: {
              'name.katakana': {
                query: katakanaQuery,
                fuzziness: 'AUTO',
                boost: 12,
              },
            },
          });
        }
      }

      // IMPROVEMENT (Priority 1A): N-gram for short queries only (2-3 chars)
      // For 4+ character queries, wildcard substring matching is more accurate
      if (charLen <= 3 && charLen >= 2) {
        // Use ngram field for substring matching - critical for very short partial matching
        allClauses.push({
          match: {
            'name.ngram': {
              query: searchQuery,
              boost: 6, // Reduced from 12/10 to prevent single-char morpheme noise
            },
          },
        });

        // IMPROVEMENT (Priority 1C): Enhanced prefix matching for all short queries
        allClauses.push({
          prefix: {
            'name.keyword': {
              value: searchQuery,
              boost: charLen <= 3 ? 15 : 12, // Higher boost for very short queries
            },
          },
        });

        // Also add wildcard prefix for better compound matching
        allClauses.push({
          wildcard: {
            'name.keyword': {
              value: `${searchQuery}*`,
              boost: charLen <= 3 ? 18 : 15, // IMPROVEMENT: Higher boost for prefix wildcards
            },
          },
        });

        allClauses.push({
          prefix: {
            'name_variants.keyword': {
              value: searchQuery,
              boost: charLen <= 3 ? 14 : 12,
            },
          },
        } as any);

        allClauses.push({
          prefix: {
            'name_synonyms.keyword': {
              value: searchQuery,
              boost: charLen <= 3 ? 16 : 13,
            },
          },
        } as any);
      }
    }

    // Include substring field for compound word matching when available
    // Note: Requires 'name.substring' field to be indexed
    if (!isJapanese && charLen >= 3) {
      allClauses.push({
        match: {
          'name.substring': {
            query: searchQuery,
            boost: 8,
          },
        },
      });
    }

    const phraseMustClauses: any[] = [];
    const seenPhraseClauses = new Set<string>();
    const registerPhraseClause = (clause: Record<string, any>) => {
      const key = JSON.stringify(clause);
      if (seenPhraseClauses.has(key))
        return;

      seenPhraseClauses.add(key);
      phraseMustClauses.push(clause);
    };

    const registerMatchPhrase = (field: string, phrase: string, boost: number) => {
      const normalizedPhrase = (phrase || '').trim();

      if (!normalizedPhrase)
        return;

      registerPhraseClause({
        match_phrase: {
          [field]: {
            query: normalizedPhrase,
            boost,
          },
        },
      });
    };

    const enforcePhraseGate = !isJapanese
      ? true
      : (isRomaji || charLen >= 3 || !!canonicalSynonym);

    if (enforcePhraseGate) {
      if (isJapanese) {
        if (isRomaji)
          registerMatchPhrase('name_romaji', searchQuery, 22);
        else
          registerMatchPhrase('name', hiraganaQuery, 15);

        const hasKanaCharacters = hasHiragana || hasKatakana;

        if (hasKanaCharacters) {
          registerMatchPhrase('name.reading', katakanaQuery, 16);
          registerMatchPhrase('name.katakana', katakanaQuery, 16);
        }

        if (hasHiragana && katakanaQuery !== hiraganaQuery)
          registerMatchPhrase('name', katakanaQuery, 12);

        if (canonicalSynonym) {
          registerMatchPhrase('name', canonicalSynonym, 22);
          registerMatchPhrase('name_synonyms', canonicalSynonym, 24);
          const canonicalKatakana = this.hiraganaToKatakana(canonicalSynonym);
          registerMatchPhrase('name.katakana', canonicalKatakana, 18);
          registerMatchPhrase('name.reading', canonicalKatakana, 18);
          registerMatchPhrase('name_synonyms', canonicalKatakana, 20);
        }
      }
      else {
        registerMatchPhrase('name', searchQuery, 30);
      }
    }

    // Explicitly promote 中華まん when searching for 中華
    const p = this.findPattern(searchQuery);
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

    const rescoreBoost = this.getRescoreBoost(searchQuery);

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

    if (isJapanese && charLen <= 2 && searchQuery) {
      functions.push({
        filter: {
          prefix: {
            'name.keyword': searchQuery,
          },
        },
        weight: 25,
      });

      functions.push({
        filter: {
          prefix: {
            'name_synonyms.keyword': searchQuery,
          },
        },
        weight: 20,
      });
    }

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
    const mustClauses: any[] = [];

    if (phraseMustClauses.length > 0) {
      mustClauses.push({
        bool: {
          should: phraseMustClauses,
          minimum_should_match: 1,
        },
      });
    }

    if (beerMust)
      mustClauses.push(beerMust);

    const coreBool: any = { should: allClauses, minimum_should_match: 1 };

    if (mustClauses.length > 0)
      coreBool.must = mustClauses;

    if (beerMustNot.length > 0)
      coreBool.must_not = beerMustNot;

    return {
      size,
      from,
      query: {
        function_score: {
          query: { bool: coreBool },
          // Boost by popularity and apply optional penalties
          functions,
          score_mode: 'sum',
          boost_mode: 'multiply', // Changed from 'sum' to 'multiply' - popularity should multiply relevance, not add to it
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
                { match_phrase: { name: { query: searchQuery, boost: 5 } } },
                // Also boost items that end with the search term
                {
                  wildcard: {
                    'name.keyword': {
                      value: `*${searchQuery}`,
                      boost: 3,
                    },
                  },
                },
                // For Japanese, boost items containing the exact term in katakana field
                ...(isJapanese
                  ? [
                      { match: { name: { query: searchQuery, boost: 4 } } },
                      {
                        match: {
                          'name.katakana': {
                            query: katakanaQuery,
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
      min_score: this.getMinScore(searchQuery),
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

      const normalizedTrigger = normalizeJapaneseText(trigger);
      if (normalizedTrigger && normalizedTrigger !== trigger)
        this.triggerMap.set(normalizedTrigger, pattern);

      const hiraganaTrigger = this.katakanaToHiragana(trigger);
      if (hiraganaTrigger && !this.triggerMap.has(hiraganaTrigger))
        this.triggerMap.set(hiraganaTrigger, pattern);

      const katakanaTrigger = this.hiraganaToKatakana(trigger);
      if (katakanaTrigger && !this.triggerMap.has(katakanaTrigger))
        this.triggerMap.set(katakanaTrigger, pattern);
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

        const normalizedTrigger = normalizeJapaneseText(trigger);
        if (normalizedTrigger)
          this.triggerMap.delete(normalizedTrigger);

        const hiraganaTrigger = this.katakanaToHiragana(trigger);
        if (hiraganaTrigger)
          this.triggerMap.delete(hiraganaTrigger);

        const katakanaTrigger = this.hiraganaToKatakana(trigger);
        if (katakanaTrigger)
          this.triggerMap.delete(katakanaTrigger);
      }
      // Remove from patterns array
      this.patterns = this.patterns.filter(p => p.id !== id);
    }
  }
}
