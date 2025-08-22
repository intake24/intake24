/**
 * Chinese Compound Food Parser
 *
 * Parses complex Chinese dish names to understand their components,
 * cooking methods, and modifiers for better search matching
 */

export interface FoodStructure {
  original: string;
  base?: string; // 面, 饭, 汤, 肉, 鱼
  protein?: string; // 牛肉, 鸡肉, 猪肉, 虾, 鱼
  vegetables?: string[]; // 青椒, 土豆, 番茄
  method?: string; // 红烧, 清蒸, 爆炒, 水煮
  flavor?: string; // 麻辣, 酸甜, 咸香
  style?: string; // 川味, 粤式, 北京, 上海
  modifiers?: string[]; // 特色, 招牌, 家常, 老式
  ingredients?: string[]; // All identified ingredients
}

export interface ParsedComponent {
  text: string;
  type: 'base' | 'protein' | 'vegetable' | 'method' | 'flavor' | 'style' | 'modifier' | 'ingredient' | 'unknown';
  position: number;
  confidence: number;
}

export class ChineseCompoundParser {
  private cookingMethods: Map<string, string[]>;
  private flavorProfiles: Map<string, string[]>;
  private foodBases: Set<string>;
  private proteins: Set<string>;
  private vegetables: Set<string>;
  private regionalStyles: Map<string, string[]>;
  private modifiers: Set<string>;

  constructor() {
    this.cookingMethods = this.buildCookingMethods();
    this.flavorProfiles = this.buildFlavorProfiles();
    this.foodBases = this.buildFoodBases();
    this.proteins = this.buildProteins();
    this.vegetables = this.buildVegetables();
    this.regionalStyles = this.buildRegionalStyles();
    this.modifiers = this.buildModifiers();
  }

  /**
   * Parse a compound food name into its components
   */
  parse(foodName: string): FoodStructure {
    const structure: FoodStructure = {
      original: foodName,
      vegetables: [],
      modifiers: [],
      ingredients: [],
    };

    // First, identify all components
    const components = this.identifyComponents(foodName);

    // Then, structure them based on patterns and rules
    this.structureComponents(components, structure);

    // Apply post-processing rules
    this.applyPostProcessingRules(structure);

    return structure;
  }

  /**
   * Generate search variations based on parsed structure
   */
  generateSearchVariations(structure: FoodStructure): string[] {
    const variations = new Set<string>([structure.original]);

    // Add base variations
    if (structure.base) {
      variations.add(structure.base);

      if (structure.protein) {
        variations.add(`${structure.protein}${structure.base}`);
      }

      if (structure.method) {
        variations.add(`${structure.method}${structure.base}`);
      }
    }

    // Add protein variations
    if (structure.protein) {
      variations.add(structure.protein);

      if (structure.method) {
        variations.add(`${structure.method}${structure.protein}`);
      }
    }

    // Add method + ingredient combinations
    if (structure.method && structure.ingredients) {
      structure.ingredients.forEach((ingredient) => {
        variations.add(`${structure.method}${ingredient}`);
      });
    }

    // Add simplified versions (remove modifiers)
    const simplified = this.simplifyName(structure);
    if (simplified !== structure.original) {
      variations.add(simplified);
    }

    // Add component combinations
    const combinations = this.generateComponentCombinations(structure);
    combinations.forEach(combo => variations.add(combo));

    return Array.from(variations);
  }

  /**
   * Check if two food names refer to similar dishes
   */
  areSimilar(name1: string, name2: string): boolean {
    const structure1 = this.parse(name1);
    const structure2 = this.parse(name2);

    // Same base food is often similar
    if (structure1.base && structure1.base === structure2.base) {
      // Check if proteins match
      if (structure1.protein && structure2.protein) {
        return structure1.protein === structure2.protein;
      }
      return true;
    }

    // Same cooking method and protein
    if (structure1.method === structure2.method &&
      structure1.protein === structure2.protein) {
      return true;
    }

    // Check ingredient overlap
    const ingredients1 = new Set(structure1.ingredients);
    const ingredients2 = new Set(structure2.ingredients);
    const intersection = new Set([...ingredients1].filter(x => ingredients2.has(x)));

    // If >50% ingredients match, consider similar
    const overlap = intersection.size / Math.max(ingredients1.size, ingredients2.size);
    return overlap > 0.5;
  }

  // Private helper methods

  private identifyComponents(foodName: string): ParsedComponent[] {
    const components: ParsedComponent[] = [];
    let processedLength = 0;

    // Try to match patterns from longest to shortest
    while (processedLength < foodName.length) {
      let matched = false;

      // Try different lengths (4, 3, 2, 1 characters)
      for (let len = Math.min(4, foodName.length - processedLength); len > 0; len--) {
        const substring = foodName.substring(processedLength, processedLength + len);
        const component = this.classifyComponent(substring, processedLength);

        if (component.type !== 'unknown' || len === 1) {
          components.push(component);
          processedLength += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // This shouldn't happen, but just in case
        processedLength++;
      }
    }

    return components;
  }

  private classifyComponent(text: string, position: number): ParsedComponent {
    // Check cooking methods
    for (const [_category, methods] of this.cookingMethods) {
      if (methods.includes(text)) {
        return { text, type: 'method', position, confidence: 0.9 };
      }
    }

    // Check flavors
    for (const [_profile, flavors] of this.flavorProfiles) {
      if (flavors.includes(text)) {
        return { text, type: 'flavor', position, confidence: 0.85 };
      }
    }

    // Check food bases
    if (this.foodBases.has(text)) {
      return { text, type: 'base', position, confidence: 0.9 };
    }

    // Check proteins
    if (this.proteins.has(text)) {
      return { text, type: 'protein', position, confidence: 0.9 };
    }

    // Check vegetables
    if (this.vegetables.has(text)) {
      return { text, type: 'vegetable', position, confidence: 0.85 };
    }

    // Check regional styles
    for (const [_region, styles] of this.regionalStyles) {
      if (styles.includes(text)) {
        return { text, type: 'style', position, confidence: 0.8 };
      }
    }

    // Check modifiers
    if (this.modifiers.has(text)) {
      return { text, type: 'modifier', position, confidence: 0.7 };
    }

    // Single character checks
    if (text.length === 1) {
      if (['鸡', '鱼', '肉', '虾', '蟹', '贝', '鸭', '牛', '羊', '猪'].includes(text)) {
        return { text, type: 'protein', position, confidence: 0.8 };
      }
      if (['面', '饭', '粥', '汤', '饼', '包'].includes(text)) {
        return { text, type: 'base', position, confidence: 0.85 };
      }
    }

    // Default to ingredient if it looks like food
    if (this.looksLikeFood(text)) {
      return { text, type: 'ingredient', position, confidence: 0.6 };
    }

    return { text, type: 'unknown', position, confidence: 0.3 };
  }

  private structureComponents(components: ParsedComponent[], structure: FoodStructure): void {
    // Group components by type
    const byType = new Map<string, ParsedComponent[]>();
    components.forEach((comp) => {
      const list = byType.get(comp.type) || [];
      list.push(comp);
      byType.set(comp.type, list);
    });

    // Assign components to structure
    const methods = byType.get('method') || [];
    if (methods.length > 0) {
      // Choose the most confident method
      structure.method = methods.reduce((best, current) =>
        current.confidence > best.confidence ? current : best,
      ).text;
    }

    const bases = byType.get('base') || [];
    if (bases.length > 0) {
      // Usually the last base is the main one
      structure.base = bases[bases.length - 1].text;
    }

    const proteins = byType.get('protein') || [];
    if (proteins.length > 0) {
      // Combine adjacent proteins
      structure.protein = this.combineAdjacentComponents(proteins);
    }

    const vegetables = byType.get('vegetable') || [];
    structure.vegetables = vegetables.map(v => v.text);

    const flavors = byType.get('flavor') || [];
    if (flavors.length > 0) {
      structure.flavor = flavors.map(f => f.text).join('');
    }

    const styles = byType.get('style') || [];
    if (styles.length > 0) {
      structure.style = styles[0].text;
    }

    const modifiers = byType.get('modifier') || [];
    structure.modifiers = modifiers.map(m => m.text);

    // Collect all food-related components as ingredients
    ['protein', 'vegetable', 'ingredient'].forEach((type) => {
      const items = byType.get(type) || [];
      items.forEach((item) => {
        if (!structure.ingredients!.includes(item.text)) {
          structure.ingredients!.push(item.text);
        }
      });
    });
  }

  private combineAdjacentComponents(components: ParsedComponent[]): string {
    // Sort by position
    components.sort((a, b) => a.position - b.position);

    let combined = '';
    let lastPosition = -1;

    components.forEach((comp) => {
      if (lastPosition === -1 || comp.position === lastPosition + comp.text.length) {
        combined += comp.text;
        lastPosition = comp.position;
      }
    });

    return combined;
  }

  private applyPostProcessingRules(structure: FoodStructure): void {
    // Rule 1: 鱼香 doesn't actually contain fish
    if (structure.flavor === '鱼香' && structure.protein === '鱼') {
      structure.protein = undefined;
    }

    // Rule 2: Combine certain method-flavor combinations
    if (structure.method === '糖' && structure.flavor === '醋') {
      structure.method = '糖醋';
      structure.flavor = '酸甜';
    }

    // Rule 3: Handle common compound patterns
    if (structure.original.includes('鱼香肉丝')) {
      structure.protein = '猪肉';
      structure.flavor = '鱼香';
      structure.method = '炒';
    }

    // Rule 4: Extract numbers and quantity modifiers
    const numberMatch = structure.original.match(/[一二三四五六七八九十百千万\d]+/);
    if (numberMatch && !structure.modifiers!.includes(numberMatch[0])) {
      structure.modifiers!.push(numberMatch[0]);
    }
  }

  private simplifyName(structure: FoodStructure): string {
    let simplified = '';

    // Build simplified name from core components
    if (structure.method)
      simplified += structure.method;
    if (structure.protein)
      simplified += structure.protein;
    if (structure.vegetables && structure.vegetables.length > 0) {
      simplified += structure.vegetables[0];
    }
    if (structure.base)
      simplified += structure.base;

    return simplified || structure.original;
  }

  private generateComponentCombinations(structure: FoodStructure): string[] {
    const combinations: string[] = [];

    // Method + each ingredient
    if (structure.method) {
      structure.ingredients?.forEach((ingredient) => {
        combinations.push(`${structure.method}${ingredient}`);
      });
    }

    // Base + each ingredient
    if (structure.base) {
      structure.ingredients?.forEach((ingredient) => {
        combinations.push(`${ingredient}${structure.base}`);
      });
    }

    // Flavor + protein/base
    if (structure.flavor) {
      if (structure.protein) {
        combinations.push(`${structure.flavor}${structure.protein}`);
      }
      if (structure.base) {
        combinations.push(`${structure.flavor}${structure.base}`);
      }
    }

    return combinations;
  }

  private looksLikeFood(text: string): boolean {
    // Simple heuristic - contains food-related characters
    const foodCharacters = ['肉', '菜', '鱼', '蛋', '奶', '油', '米', '面', '汤', '水', '果', '豆', '薯', '瓜'];
    return foodCharacters.some(char => text.includes(char));
  }

  // Data initialization methods

  private buildCookingMethods(): Map<string, string[]> {
    const methods = new Map<string, string[]>();

    methods.set('炒', ['炒', '爆炒', '煸炒', '清炒', '干炒', '滑炒', '生炒', '熟炒']);
    methods.set('烧', ['烧', '红烧', '白烧', '干烧', '焖烧']);
    methods.set('煮', ['煮', '水煮', '白煮', '清煮', '卤煮']);
    methods.set('蒸', ['蒸', '清蒸', '粉蒸', '蒜蒸']);
    methods.set('炸', ['炸', '油炸', '干炸', '软炸', '酥炸', '脆炸']);
    methods.set('烤', ['烤', '炭烤', '明火烤', '烘烤']);
    methods.set('煎', ['煎', '香煎', '干煎', '生煎']);
    methods.set('炖', ['炖', '清炖', '红炖', '隔水炖']);
    methods.set('焖', ['焖', '黄焖', '油焖']);
    methods.set('卤', ['卤', '卤水', '卤制']);
    methods.set('拌', ['拌', '凉拌', '热拌', '生拌']);
    methods.set('腌', ['腌', '腌制', '糟', '醉']);

    return methods;
  }

  private buildFlavorProfiles(): Map<string, string[]> {
    const flavors = new Map<string, string[]>();

    flavors.set('辣', ['麻辣', '香辣', '酸辣', '甜辣', '微辣', '中辣', '特辣', '变态辣']);
    flavors.set('甜', ['糖醋', '酸甜', '甜酸', '蜜汁', '糖', '甜']);
    flavors.set('咸', ['咸鲜', '咸香', '咸辣', '咸']);
    flavors.set('酸', ['酸辣', '酸甜', '酸菜', '酸汤', '酸']);
    flavors.set('鲜', ['鲜香', '鲜甜', '鲜辣', '鲜']);
    flavors.set('香', ['五香', '十三香', '香辣', '香酥', '椒香', '葱香', '蒜香']);
    flavors.set('特殊', ['鱼香', '宫保', '怪味', '椒盐', '孜然', '咖喱']);

    return flavors;
  }

  private buildFoodBases(): Set<string> {
    return new Set([
      '面',
      '饭',
      '粥',
      '汤',
      '饼',
      '包',
      '饺',
      '馄饨',
      '米线',
      '米粉',
      '河粉',
      '粉丝',
      '年糕',
      '糕',
      '卷',
      '夹',
      '堡',
      '条',
      '丝',
      '块',
      '片',
      '丁',
      '羹',
      '煲',
      '锅',
      '盅',
    ]);
  }

  private buildProteins(): Set<string> {
    return new Set([
      // Meat
      '猪肉',
      '牛肉',
      '羊肉',
      '鸡肉',
      '鸭肉',
      '鹅肉',
      '排骨',
      '五花肉',
      '里脊',
      '肉丝',
      '肉片',
      '肉末',
      '肉丸',
      '猪',
      '牛',
      '羊',
      '鸡',
      '鸭',
      '鹅',

      // Seafood
      '鱼',
      '虾',
      '蟹',
      '贝',
      '鱿鱼',
      '墨鱼',
      '带鱼',
      '黄鱼',
      '鲈鱼',
      '鲤鱼',
      '草鱼',
      '鲫鱼',
      '龙虾',
      '基围虾',
      '明虾',
      '螃蟹',
      '大闸蟹',
      '扇贝',
      '生蚝',
      '鲍鱼',
      '海参',

      // Other proteins
      '蛋',
      '鸡蛋',
      '鸭蛋',
      '鹌鹑蛋',
      '豆腐',
      '豆干',
      '腐竹',
    ]);
  }

  private buildVegetables(): Set<string> {
    return new Set([
      // Common vegetables
      '白菜',
      '青菜',
      '菠菜',
      '生菜',
      '油菜',
      '芹菜',
      '韭菜',
      '土豆',
      '番茄',
      '西红柿',
      '黄瓜',
      '茄子',
      '辣椒',
      '青椒',
      '萝卜',
      '胡萝卜',
      '洋葱',
      '大葱',
      '小葱',
      '葱',
      '姜',
      '蒜',
      '豆芽',
      '豆角',
      '四季豆',
      '黄豆',
      '毛豆',
      '豌豆',
      '冬瓜',
      '南瓜',
      '丝瓜',
      '苦瓜',
      '黄瓜',
      '木耳',
      '香菇',
      '蘑菇',
      '金针菇',
      '平菇',
      '杏鲍菇',
      '竹笋',
      '莲藕',
      '山药',
      '芋头',
      '玉米',
    ]);
  }

  private buildRegionalStyles(): Map<string, string[]> {
    const styles = new Map<string, string[]>();

    styles.set('川', ['川味', '川式', '四川', '成都', '重庆']);
    styles.set('粤', ['粤式', '广东', '广式', '潮汕', '客家']);
    styles.set('鲁', ['鲁味', '山东', '济南', '青岛']);
    styles.set('苏', ['苏式', '江苏', '淮扬', '苏州', '南京']);
    styles.set('浙', ['浙江', '杭州', '宁波', '温州']);
    styles.set('闽', ['闽南', '福建', '厦门', '福州']);
    styles.set('湘', ['湘味', '湖南', '长沙']);
    styles.set('徽', ['徽州', '安徽']);
    styles.set('京', ['北京', '京味', '老北京']);
    styles.set('沪', ['上海', '本帮', '海派']);
    styles.set('东北', ['东北', '哈尔滨', '沈阳']);
    styles.set('西北', ['西北', '新疆', '兰州', '西安']);

    return styles;
  }

  private buildModifiers(): Set<string> {
    return new Set([
      '招牌',
      '特色',
      '秘制',
      '私房',
      '家常',
      '传统',
      '古法',
      '老式',
      '新式',
      '改良',
      '创新',
      '精品',
      '极品',
      '顶级',
      '小',
      '大',
      '中',
      '特大',
      '迷你',
      '超级',
      '加强',
      '微',
      '重',
      '浓',
      '淡',
      '清',
      '鲜',
      '嫩',
      '脆',
      '酥',
    ]);
  }
}

// Export singleton instance
export const compoundParser = new ChineseCompoundParser();
