/**
 * Chinese Intent Detector for understanding search intent
 *
 * Detects nutritional, dietary, meal time, and other intent types
 * to provide more relevant search results
 */
export interface SearchIntent {
  type: 'nutritional' | 'dietary' | 'mealTime' | 'ingredient' | 'cooking' | 'taste' | 'health' | 'general';
  confidence: number;
  subType?: string;
  entities: string[];
  modifiers: string[];
  negations: string[];
}

export interface NutritionalFilter {
  calories?: { min?: number; max?: number };
  protein?: { min?: number; max?: number };
  carbs?: { min?: number; max?: number };
  fat?: { min?: number; max?: number };
  sugar?: { min?: number; max?: number };
  sodium?: { min?: number; max?: number };
}

export class ChineseIntentDetector {
  private patterns: Map<string, RegExp>;
  private intentKeywords: Map<string, string[]>;

  constructor() {
    this.patterns = this.buildPatterns();
    this.intentKeywords = this.buildIntentKeywords();
  }

  /**
   * Detect intent from search query
   */
  detectIntent(query: string): SearchIntent {
    const intents: SearchIntent[] = [];

    // Check each intent type
    intents.push(...this.detectNutritionalIntent(query));
    intents.push(...this.detectDietaryIntent(query));
    intents.push(...this.detectMealTimeIntent(query));
    intents.push(...this.detectIngredientIntent(query));
    intents.push(...this.detectCookingIntent(query));
    intents.push(...this.detectTasteIntent(query));
    intents.push(...this.detectHealthIntent(query));

    // Return highest confidence intent
    if (intents.length === 0) {
      return {
        type: 'general',
        confidence: 0.5,
        entities: [],
        modifiers: [],
        negations: [],
      };
    }

    return intents.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );
  }

  /**
   * Extract nutritional filters from query
   */
  extractNutritionalFilters(query: string): NutritionalFilter {
    const filters: NutritionalFilter = {};

    // Calorie patterns
    const caloriePatterns = [
      { pattern: /低于?(\d+)卡/, type: 'max' },
      { pattern: /少于(\d+)卡/, type: 'max' },
      { pattern: /(\d+)卡以下/, type: 'max' },
      { pattern: /高于(\d+)卡/, type: 'min' },
      { pattern: /超过(\d+)卡/, type: 'min' },
      { pattern: /(\d+)卡以上/, type: 'min' },
      { pattern: /(\d+)-(\d+)卡/, type: 'range' },
      { pattern: /低卡/, type: 'low' },
      { pattern: /高卡/, type: 'high' },
    ];

    caloriePatterns.forEach(({ pattern, type }) => {
      const match = query.match(pattern);
      if (match) {
        if (type === 'max') {
          filters.calories = { max: Number.parseInt(match[1]) };
        }
        else if (type === 'min') {
          filters.calories = { min: Number.parseInt(match[1]) };
        }
        else if (type === 'range') {
          filters.calories = { min: Number.parseInt(match[1]), max: Number.parseInt(match[2]) };
        }
        else if (type === 'low') {
          filters.calories = { max: 300 };
        }
        else if (type === 'high') {
          filters.calories = { min: 500 };
        }
      }
    });

    // Protein patterns
    const proteinPatterns = [
      { pattern: /高蛋白/, value: { min: 20 } },
      { pattern: /低蛋白/, value: { max: 10 } },
      { pattern: /富含蛋白/, value: { min: 15 } },
      { pattern: /(\d+)克?蛋白/, value: (match: RegExpMatchArray) => ({ min: Number.parseInt(match[1]) }) },
    ];

    proteinPatterns.forEach(({ pattern, value }) => {
      const match = query.match(pattern);
      if (match) {
        filters.protein = typeof value === 'function' ? value(match) : value;
      }
    });

    // Similar patterns for other nutrients
    if (query.includes('低糖') || query.includes('无糖')) {
      filters.sugar = { max: 5 };
    }
    if (query.includes('低盐') || query.includes('少盐')) {
      filters.sodium = { max: 500 };
    }
    if (query.includes('低脂')) {
      filters.fat = { max: 10 };
    }

    return filters;
  }

  /**
   * Get search modifiers based on intent
   */
  getSearchModifiers(intent: SearchIntent): {
    boostFactors: Record<string, number>;
    filterFunctions: Array<(item: any) => boolean>;
    sortPreference: 'relevance' | 'nutritional' | 'popularity';
  } {
    const modifiers = {
      boostFactors: {} as Record<string, number>,
      filterFunctions: [] as Array<(item: any) => boolean>,
      sortPreference: 'relevance' as 'relevance' | 'nutritional' | 'popularity',
    };

    switch (intent.type) {
      case 'nutritional':
        modifiers.sortPreference = 'nutritional';
        if (intent.subType === 'low_calorie') {
          modifiers.boostFactors.lowCalorie = 2.0;
        }
        else if (intent.subType === 'high_protein') {
          modifiers.boostFactors.highProtein = 2.0;
        }
        break;

      case 'dietary':
        if (intent.subType === 'vegetarian') {
          modifiers.filterFunctions.push(item => !item.containsMeat);
          modifiers.boostFactors.vegetarian = 3.0;
        }
        else if (intent.subType === 'halal') {
          modifiers.filterFunctions.push(item => item.isHalal);
        }
        break;

      case 'mealTime':
        if (intent.subType === 'breakfast') {
          modifiers.boostFactors.breakfast = 2.5;
        }
        else if (intent.subType === 'dinner') {
          modifiers.boostFactors.mainDish = 2.0;
        }
        break;

      case 'health':
        modifiers.boostFactors.healthy = 2.0;
        modifiers.sortPreference = 'nutritional';
        break;
    }

    // Handle negations
    intent.negations.forEach((negation) => {
      if (negation === '辣') {
        modifiers.filterFunctions.push(item => !item.isSpicy);
      }
      else if (negation === '油腻') {
        modifiers.filterFunctions.push(item => item.fatContent < 20);
      }
    });

    return modifiers;
  }

  // Private detection methods
  private detectNutritionalIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const nutritionalPatterns = this.patterns.get('nutritional')!;

    const match = query.match(nutritionalPatterns);
    if (match) {
      const entities = this.extractEntities(query, 'nutritional');
      const subType = this.determineNutritionalSubType(query);

      intents.push({
        type: 'nutritional',
        confidence: 0.9,
        subType,
        entities,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectDietaryIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const dietaryPatterns = this.patterns.get('dietary')!;

    const match = query.match(dietaryPatterns);
    if (match) {
      const entities = this.extractEntities(query, 'dietary');
      const subType = this.determineDietarySubType(query);

      intents.push({
        type: 'dietary',
        confidence: 0.85,
        subType,
        entities,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectMealTimeIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const mealTimePatterns = this.patterns.get('mealTime')!;

    const match = query.match(mealTimePatterns);
    if (match) {
      const entities = this.extractEntities(query, 'mealTime');
      const subType = this.determineMealTimeSubType(query);

      intents.push({
        type: 'mealTime',
        confidence: 0.8,
        subType,
        entities,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectIngredientIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const ingredientPatterns = this.patterns.get('ingredient')!;

    const match = query.match(ingredientPatterns);
    if (match) {
      const entities = this.extractIngredients(query);

      intents.push({
        type: 'ingredient',
        confidence: 0.85,
        entities,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectCookingIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const cookingMethods = ['炒', '煮', '蒸', '炸', '烤', '炖', '焖', '煎', '卤', '凉拌'];

    const found = cookingMethods.filter(method => query.includes(method));
    if (found.length > 0) {
      intents.push({
        type: 'cooking',
        confidence: 0.75,
        entities: found,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectTasteIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const tastes = ['甜', '咸', '酸', '辣', '苦', '麻', '鲜', '香'];

    const found = tastes.filter(taste => query.includes(taste));
    if (found.length > 0) {
      intents.push({
        type: 'taste',
        confidence: 0.7,
        entities: found,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private detectHealthIntent(query: string): SearchIntent[] {
    const intents: SearchIntent[] = [];
    const healthPatterns = this.patterns.get('health')!;

    const match = query.match(healthPatterns);
    if (match) {
      const entities = this.extractEntities(query, 'health');
      const subType = this.determineHealthSubType(query);

      intents.push({
        type: 'health',
        confidence: 0.85,
        subType,
        entities,
        modifiers: this.extractModifiers(query),
        negations: this.extractNegations(query),
      });
    }

    return intents;
  }

  private buildPatterns(): Map<string, RegExp> {
    const patterns = new Map<string, RegExp>();

    patterns.set('nutritional', /(?:[低高少多无零]|富含)?(?:卡路里|卡|热量|蛋白质?|脂肪|糖分?|盐分?|纤维|碳水化合物|碳水|营养|维生素|矿物质)/);

    patterns.set('dietary', /(?:素食|纯素|清真|无麸质|生酮|低碳|无乳糖|过敏|忌口|不吃|不要)/);

    patterns.set('mealTime', /(?:早餐|早饭|早点|午餐|午饭|中餐|晚餐|晚饭|夜宵|宵夜|下午茶|点心)/);

    patterns.set('ingredient', /(?:含有|包含|[有带加无]|不要|不含|去掉|没有).*(?:[的肉菜蛋奶鱼虾]|辣椒|花生|坚果)/);

    patterns.set('health', /(?:健康|养生|减肥|瘦身|增肌|降压|降糖|降脂|补血|补钙|补铁|清火|润燥|养胃)/);

    return patterns;
  }

  private buildIntentKeywords(): Map<string, string[]> {
    const keywords = new Map<string, string[]>();

    keywords.set('nutritional', [
      '低卡',
      '高蛋白',
      '低脂',
      '低糖',
      '低盐',
      '高纤维',
      '营养',
      '健康',
      '轻食',
      '代餐',
    ]);

    keywords.set('dietary', [
      '素食',
      '纯素',
      '清真',
      'halal',
      '无麸质',
      '生酮',
      '过敏',
      '乳糖不耐',
      '糖尿病',
      '三高',
    ]);

    keywords.set('health', [
      '养生',
      '补气',
      '补血',
      '滋阴',
      '壮阳',
      '清热',
      '解毒',
      '润肺',
      '养胃',
      '护肝',
    ]);

    return keywords;
  }

  private extractEntities(query: string, intentType: string): string[] {
    const keywords = this.intentKeywords.get(intentType) || [];
    return keywords.filter(keyword => query.includes(keyword));
  }

  private extractIngredients(query: string): string[] {
    const ingredients: string[] = [];

    // Common ingredient patterns
    const patterns = [
      /(?:含有|包含|有|带)(.+?)(?:的|$)/,
      /(.+?)(?:做的|制作)/,
      /用(.+?)(?:做|制)/,
    ];

    patterns.forEach((pattern) => {
      const match = query.match(pattern);
      if (match && match[1]) {
        // Split by common delimiters
        const items = match[1].split(/[、，,和与及]/);
        ingredients.push(...items.map(i => i.trim()).filter(i => i.length > 0));
      }
    });

    return ingredients;
  }

  private extractModifiers(query: string): string[] {
    const modifiers: string[] = [];

    const modifierKeywords = [
      '特别',
      '非常',
      '很',
      '超级',
      '最',
      '比较',
      '稍微',
      '有点',
      '适量',
      '多',
      '少',
      'extra',
    ];

    modifierKeywords.forEach((modifier) => {
      if (query.includes(modifier)) {
        modifiers.push(modifier);
      }
    });

    return modifiers;
  }

  private extractNegations(query: string): string[] {
    const negations: string[] = [];

    // Extract negated items
    const negationPatterns = [
      /不要(.+?)(?:[，。、]|$)/g,
      /不含(.+?)(?:[，。、]|$)/g,
      /无(.+?)(?:[，。、]|$)/g,
      /去掉(.+?)(?:[，。、]|$)/g,
      /不吃(.+?)(?:[，。、]|$)/g,
      /忌(.+?)(?:[，。、]|$)/g,
    ];

    negationPatterns.forEach((pattern) => {
      const matches = Array.from(query.matchAll(pattern));
      matches.forEach((match) => {
        if (match[1]) {
          negations.push(match[1].trim());
        }
      });
    });

    return negations;
  }

  private determineNutritionalSubType(query: string): string {
    if (query.includes('低卡') || query.includes('低热量'))
      return 'low_calorie';
    if (query.includes('高蛋白'))
      return 'high_protein';
    if (query.includes('低脂'))
      return 'low_fat';
    if (query.includes('低糖') || query.includes('无糖'))
      return 'low_sugar';
    if (query.includes('低盐') || query.includes('少盐'))
      return 'low_sodium';
    if (query.includes('高纤维'))
      return 'high_fiber';
    return 'balanced';
  }

  private determineDietarySubType(query: string): string {
    if (query.includes('素食') && !query.includes('纯素'))
      return 'vegetarian';
    if (query.includes('纯素') || query.includes('全素'))
      return 'vegan';
    if (query.includes('清真') || query.includes('halal'))
      return 'halal';
    if (query.includes('无麸质'))
      return 'gluten_free';
    if (query.includes('生酮') || query.includes('keto'))
      return 'keto';
    if (query.includes('低碳'))
      return 'low_carb';
    return 'general';
  }

  private determineMealTimeSubType(query: string): string {
    if (query.includes('早餐') || query.includes('早饭') || query.includes('早点'))
      return 'breakfast';
    if (query.includes('午餐') || query.includes('午饭') || query.includes('中餐'))
      return 'lunch';
    if (query.includes('晚餐') || query.includes('晚饭'))
      return 'dinner';
    if (query.includes('夜宵') || query.includes('宵夜'))
      return 'late_night';
    if (query.includes('下午茶'))
      return 'afternoon_tea';
    if (query.includes('点心'))
      return 'snack';
    return 'any';
  }

  private determineHealthSubType(query: string): string {
    if (query.includes('减肥') || query.includes('瘦身'))
      return 'weight_loss';
    if (query.includes('增肌'))
      return 'muscle_gain';
    if (query.includes('降压'))
      return 'lower_blood_pressure';
    if (query.includes('降糖'))
      return 'lower_blood_sugar';
    if (query.includes('降脂'))
      return 'lower_cholesterol';
    if (query.includes('养胃'))
      return 'digestive_health';
    return 'general_health';
  }
}

// Export singleton instance
export const intentDetector = new ChineseIntentDetector();
