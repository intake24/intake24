/**
 * Query Classifier for Japanese Food Search
 *
 * Analyzes query characteristics to determine optimal search strategy.
 */

export interface QueryCharacteristics {
  isCategory: boolean;
  isExact: boolean;
  confidence: number;
  reasoning: string[];
}

export class JapaneseQueryClassifier {
  // Generic category terms that indicate broad searches
  private readonly categoryTerms = [
    '菓子', // sweets/snacks
    '料理', // cuisine/dish
    '飲料', // beverage
    'デザート', // dessert
    'パン', // bread
    '麺', // noodles
    'ジュース', // juice
    '中華', // Chinese food
    '和食', // Japanese food
    '洋食', // Western food
    'スナック', // snack
    'ケーキ', // cake
    'まん', // bun (e.g., 中華まん)
    'せんべい', // rice cracker
  ];

  // Known synonym failure patterns from analysis
  private readonly synonymPatterns = [
    'シーチキン', // "SeaChicken" (tuna brand) → ツナマヨネーズ
    'ケーキドーナツ', // cake donut → オールドファッション
    'らっかせい', // peanut (formal) → バターピーナッツ
  ];

  // Specific markers that indicate exact/specific queries
  private readonly exactMarkers = [
    '（',
    '）', // full-width parentheses
    '(',
    ')', // half-width parentheses
    '%',
    '％', // percentage symbols
    '０',
    '１',
    '２',
    '３',
    '４',
    '５',
    '６',
    '７',
    '８',
    '９', // full-width numbers
  ];

  // Short terms that are still specific (whitelist)
  private readonly specificShortTerms = [
    'りんご', // apple
    'みかん', // mandarin
    'バナナ', // banana
    'いちご', // strawberry
    'ぶどう', // grape
    'もも', // peach
    'なし', // pear
    'すいか', // watermelon
    'メロン', // melon
    'ごはん', // rice
    'みそ', // miso
    'しょうゆ', // soy sauce
    'とうふ', // tofu
    '牛乳', // milk
  ];

  /**
   * Classify a query to determine optimal search strategy
   */
  classify(query: string): QueryCharacteristics {
    const reasoning: string[] = [];
    let confidence = 0.5; // default medium confidence

    const trimmedQuery = query.trim();
    const queryLength = trimmedQuery.length;

    // Check for exact markers (highest priority)
    const hasExactMarkers = this.exactMarkers.some(marker => trimmedQuery.includes(marker));
    if (hasExactMarkers) {
      confidence = 0.9;
      reasoning.push('Contains specific markers (parentheses, percentages, numbers)');

      return {
        isCategory: false,
        isExact: true,
        confidence,
        reasoning,
      };
    }

    // Check for half-width numbers (0-9)
    if (/\d/.test(trimmedQuery)) {
      confidence = 0.85;
      reasoning.push('Contains half-width numbers');

      return {
        isCategory: false,
        isExact: true,
        confidence,
        reasoning,
      };
    }

    // Check for known synonym failure patterns
    const matchesSynonymPattern = this.synonymPatterns.some(pattern =>
      trimmedQuery.includes(pattern),
    );
    if (matchesSynonymPattern) {
      confidence = 0.85;
      reasoning.push('Matches known synonym failure pattern');

      return {
        isCategory: true,
        isExact: false,
        confidence,
        reasoning,
      };
    }

    // Check for generic category terms
    const hasCategoryTerm = this.categoryTerms.some(term => trimmedQuery.includes(term));
    if (hasCategoryTerm) {
      confidence = 0.8;
      reasoning.push('Contains generic category term');

      return {
        isCategory: true,
        isExact: false,
        confidence,
        reasoning,
      };
    }

    // Check for short queries (2-4 characters)
    if (queryLength >= 2 && queryLength <= 4) {
      // Check if it's in the specific whitelist
      const isSpecific = this.specificShortTerms.includes(trimmedQuery);

      if (isSpecific) {
        confidence = 0.7;
        reasoning.push('Short query in specific whitelist');

        return {
          isCategory: false,
          isExact: true,
          confidence,
          reasoning,
        };
      }

      // Otherwise, short queries without specific markers are likely category searches
      confidence = 0.6;
      reasoning.push('Short generic query (2-4 characters)');

      return {
        isCategory: true,
        isExact: false,
        confidence,
        reasoning,
      };
    }

    // Long queries (5+ characters) without specific markers
    // Default to exact/specific search (use baseline K=100)
    confidence = 0.5;
    reasoning.push('Long query without category indicators (default to exact)');

    return {
      isCategory: false,
      isExact: true,
      confidence,
      reasoning,
    };
  }

  /**
   * Get recommended kNN K value based on query characteristics
   */
  getRecommendedKnnK(characteristics: QueryCharacteristics, defaultK = 100, categoryK = 200): number {
    if (characteristics.isCategory && characteristics.confidence >= 0.6) {
      return categoryK;
    }
    return defaultK;
  }
}
