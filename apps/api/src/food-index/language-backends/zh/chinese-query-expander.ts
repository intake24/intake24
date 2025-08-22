/**
 * Chinese Query Expander for enhancing search queries with synonyms and related terms
 */
export class ChineseQueryExpander {
  private readonly synonymGroups: Map<string, Set<string>>;
  private readonly relatedTerms: Map<string, Set<string>>;
  private readonly categoryExpansions: Map<string, Set<string>>;

  constructor() {
    this.synonymGroups = this.buildSynonymGroups();
    this.relatedTerms = this.buildRelatedTerms();
    this.categoryExpansions = this.buildCategoryExpansions();
  }

  /**
   * Expand a query with synonyms and related terms
   */
  expandQuery(query: string, options: {
    includeSynonyms?: boolean;
    includeRelated?: boolean;
    includeCategories?: boolean;
    maxExpansions?: number;
  } = {}): string[] {
    const {
      includeSynonyms = true,
      includeRelated = true,
      includeCategories = true,
      maxExpansions = 10,
    } = options;

    const expansions = new Set<string>([query]);

    // Split query into terms for individual expansion
    const terms = this.tokenizeQuery(query);

    terms.forEach((term) => {
      // Add synonyms
      if (includeSynonyms) {
        const synonyms = this.getSynonyms(term);
        synonyms.forEach(syn => expansions.add(syn));
      }

      // Add related terms
      if (includeRelated) {
        const related = this.getRelatedTerms(term);
        related.forEach(rel => expansions.add(rel));
      }

      // Add category expansions
      if (includeCategories) {
        const categories = this.getCategoryExpansions(term);
        categories.forEach(cat => expansions.add(cat));
      }
    });

    // Also try to expand the entire query as a phrase
    if (terms.length > 1) {
      const phraseSynonyms = this.getSynonyms(query);
      phraseSynonyms.forEach(syn => expansions.add(syn));
    }

    // Limit the number of expansions
    const resultArray = Array.from(expansions);
    if (resultArray.length > maxExpansions) {
      // Prioritize: original query, direct synonyms, then related terms
      const prioritized = [query];

      // Add direct synonyms first
      terms.forEach((term) => {
        const syns = this.getSynonyms(term);
        prioritized.push(...syns);
      });

      // Fill remaining slots with related terms
      const remaining = maxExpansions - prioritized.length;
      if (remaining > 0) {
        const relatedExpansions = resultArray.filter(exp =>
          !prioritized.includes(exp),
        ).slice(0, remaining);
        prioritized.push(...relatedExpansions);
      }

      return prioritized.slice(0, maxExpansions);
    }

    return resultArray;
  }

  /**
   * Get synonyms for a term
   */
  getSynonyms(term: string): string[] {
    const synonyms = new Set<string>();

    // Check each synonym group
    this.synonymGroups.forEach((group) => {
      if (group.has(term)) {
        group.forEach((syn) => {
          if (syn !== term) {
            synonyms.add(syn);
          }
        });
      }
    });

    return Array.from(synonyms);
  }

  /**
   * Get related terms
   */
  getRelatedTerms(term: string): string[] {
    return Array.from(this.relatedTerms.get(term) || []);
  }

  /**
   * Get category expansions
   */
  getCategoryExpansions(term: string): string[] {
    return Array.from(this.categoryExpansions.get(term) || []);
  }

  /**
   * Tokenize query into searchable terms
   */
  private tokenizeQuery(query: string): string[] {
    // Remove spaces and split by common delimiters
    const cleaned = query.replace(/\s+/g, '');
    const terms: string[] = [cleaned];

    // For queries 2-4 characters, also add individual characters
    if (cleaned.length >= 2 && cleaned.length <= 4) {
      for (const char of cleaned) {
        if (this.isChinese(char)) {
          terms.push(char);
        }
      }
    }

    // For longer queries, try to identify meaningful sub-phrases
    if (cleaned.length > 4) {
      // Check for common food patterns
      const patterns = [
        /(.+)([鸡鸭鱼肉虾蟹牛羊猪])/,
        /(红烧|清蒸|水煮|爆炒|凉拌|糖醋|鱼香|宫保|麻辣)(.+)/,
        /(.+)([汤面饭粥饼包])/,
      ];

      patterns.forEach((pattern) => {
        const match = cleaned.match(pattern);
        if (match) {
          match.slice(1).forEach((part) => {
            if (part && part.length > 0) {
              terms.push(part);
            }
          });
        }
      });
    }

    return [...new Set(terms)];
  }

  /**
   * Check if a character is Chinese
   */
  private isChinese(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4DBF) || // CJK Extension A
      (code >= 0x20000 && code <= 0x2A6DF) // CJK Extension B
    );
  }

  /**
   * Build synonym groups for common food terms
   */
  private buildSynonymGroups(): Map<string, Set<string>> {
    const groups = new Map<string, Set<string>>();

    // Helper to add a synonym group
    const addGroup = (terms: string[]) => {
      const group = new Set(terms);
      const groupId = terms.join('|');
      groups.set(groupId, group);
    };

    // Vegetables
    addGroup(['土豆', '马铃薯', '洋芋', '洋山芋']);
    addGroup(['番茄', '西红柿', '洋柿子']);
    addGroup(['花生', '落花生', '长生果']);
    addGroup(['玉米', '苞米', '苞谷', '棒子']);
    addGroup(['红薯', '地瓜', '番薯', '山芋', '甘薯']);
    addGroup(['黄瓜', '青瓜']);
    addGroup(['茄子', '矮瓜']);
    addGroup(['韭菜', '起阳草']);
    addGroup(['卷心菜', '包菜', '洋白菜', '圆白菜']);
    addGroup(['莴苣', '莴笋']);
    addGroup(['芫荽', '香菜', '芫茜']);
    addGroup(['木薯', '树薯']);

    // Meat
    addGroup(['猪肉', '豚肉']);
    addGroup(['牛肉', '黄牛肉']);
    addGroup(['鸡肉', '鸡']);
    addGroup(['鸭肉', '鸭']);
    addGroup(['羊肉', '山羊肉', '绵羊肉']);

    // Seafood
    addGroup(['明虾', '对虾', '大虾']);
    addGroup(['鱿鱼', '枪乌贼', '柔鱼']);
    addGroup(['带鱼', '刀鱼', '牙带鱼']);
    addGroup(['墨鱼', '乌贼', '花枝']);
    addGroup(['龙虾', '澳龙', '波龙']);
    addGroup(['扇贝', '带子']);
    addGroup(['鲍鱼', '鲍']);
    addGroup(['海参', '刺参']);

    // Dishes
    addGroup(['红烧肉', '东坡肉', '毛氏红烧肉']);
    addGroup(['馄饨', '云吞', '抄手', '扁食']);
    addGroup(['汤圆', '元宵', '圆子']);
    addGroup(['粽子', '角黍', '筒粽']);
    addGroup(['包子', '馒头']); // In some regions
    addGroup(['油条', '油炸鬼', '油炸桧']);
    addGroup(['豆腐脑', '豆花', '豆腐花']);
    addGroup(['锅贴', '煎饺', '生煎包']);
    addGroup(['肉夹馍', '肉夹馒', '白吉馍']);
    addGroup(['煎饼', '煎饼果子']);
    addGroup(['凉皮', '凉皮子', '酿皮']);

    // Beverages
    addGroup(['豆浆', '豆奶', '豆乳']);
    addGroup(['白开水', '开水', '凉白开', '温开水']);
    addGroup(['汽水', '碳酸饮料', '汽儿']);
    addGroup(['酸奶', '优酪乳', '乳酸菌饮料']);
    addGroup(['咖啡', '咖啡饮料']);
    addGroup(['牛奶', '鲜奶', '纯牛奶']);

    // Grains
    addGroup(['大米', '稻米', '白米', '米']);
    addGroup(['小麦', '麦子']);
    addGroup(['高粱', '蜀黍']);
    addGroup(['荞麦', '乌麦', '花麦']);
    addGroup(['燕麦', '雀麦']);
    addGroup(['面条', '面', '挂面']);
    addGroup(['米线', '米粉']);

    // Seasonings
    addGroup(['花椒', '川椒', '山椒']);
    addGroup(['八角', '大料', '八角茴香']);
    addGroup(['桂皮', '肉桂']);
    addGroup(['香叶', '月桂叶']);
    addGroup(['生姜', '姜', '姜片', '姜丝']);
    addGroup(['大蒜', '蒜', '蒜头']);
    addGroup(['葱', '大葱', '小葱', '香葱']);

    // Cooking methods
    addGroup(['炒', '爆炒', '煸炒', '清炒']);
    addGroup(['炸', '油炸', '干炸', '软炸']);
    addGroup(['煮', '水煮', '白煮', '清煮']);
    addGroup(['蒸', '清蒸', '粉蒸']);
    addGroup(['烤', '烘烤', '炙烤']);
    addGroup(['卤', '卤煮', '卤制']);

    return groups;
  }

  /**
   * Build related terms mapping
   */
  private buildRelatedTerms(): Map<string, Set<string>> {
    const related = new Map<string, Set<string>>();

    // Helper to add bidirectional relationships
    const addRelated = (term1: string, terms: string[]) => {
      // Add all terms as related to term1
      const set1 = related.get(term1) || new Set<string>();
      terms.forEach(t => set1.add(t));
      related.set(term1, set1);

      // Also add term1 as related to all terms
      terms.forEach((term) => {
        const set = related.get(term) || new Set<string>();
        set.add(term1);
        related.set(term, set);
      });
    };

    // Chicken related
    addRelated('鸡', ['鸡肉', '鸡翅', '鸡腿', '鸡胸', '鸡爪', '鸡心', '鸡肝', '鸡蛋', '土鸡', '乌鸡']);
    addRelated('鸡肉', ['鸡块', '鸡丝', '鸡丁', '鸡片', '鸡泥']);

    // Beef related
    addRelated('牛', ['牛肉', '牛排', '牛腩', '牛腱', '牛筋', '牛舌', '牛尾', '牛杂']);
    addRelated('牛肉', ['牛肉丝', '牛肉片', '牛肉末', '牛肉丸']);

    // Pork related
    addRelated('猪', ['猪肉', '排骨', '猪蹄', '猪肝', '猪心', '猪舌', '猪耳', '五花肉', '里脊肉']);
    addRelated('猪肉', ['肉丝', '肉片', '肉末', '肉丸', '肉饼']);

    // Fish related
    addRelated('鱼', ['鱼肉', '鱼片', '鱼丸', '鱼饼', '鱼松', '鱼子', '鱼头', '鱼尾']);
    addRelated('海鲜', ['鱼', '虾', '蟹', '贝', '鱿鱼', '墨鱼', '海参', '鲍鱼']);

    // Rice related
    addRelated('米', ['米饭', '炒饭', '烩饭', '盖饭', '拌饭', '粥', '稀饭']);
    addRelated('饭', ['白饭', '炒饭', '蛋炒饭', '扬州炒饭', '什锦炒饭']);

    // Noodle related
    addRelated('面', ['面条', '拉面', '刀削面', '手擀面', '方便面', '挂面', '乌冬面']);
    addRelated('面条', ['汤面', '拌面', '炒面', '凉面', '热干面']);

    // Soup related
    addRelated('汤', ['鸡汤', '骨汤', '鱼汤', '菜汤', '蛋汤', '豆腐汤', '酸辣汤', '番茄汤']);

    // Vegetable categories
    addRelated('蔬菜', ['青菜', '叶菜', '根菜', '瓜类', '豆类', '菌类']);
    addRelated('青菜', ['白菜', '菠菜', '油菜', '生菜', '芹菜', '韭菜']);

    // Spicy food
    addRelated('辣', ['辣椒', '小米辣', '朝天椒', '青椒', '红椒', '泡椒', '剁椒']);
    addRelated('麻辣', ['麻辣烫', '麻辣火锅', '麻辣香锅', '麻辣鱼', '麻辣小龙虾']);

    // Sweet food
    addRelated('甜', ['甜点', '甜品', '糖', '蜂蜜', '糖浆', '甜面酱']);
    addRelated('甜点', ['蛋糕', '饼干', '布丁', '冰淇淋', '巧克力']);

    // Cooking oil
    addRelated('油', ['花生油', '菜籽油', '橄榄油', '玉米油', '葵花籽油', '芝麻油']);

    return related;
  }

  /**
   * Build category expansions
   */
  private buildCategoryExpansions(): Map<string, Set<string>> {
    const categories = new Map<string, Set<string>>();

    // Helper to add category
    const addCategory = (category: string, items: string[]) => {
      categories.set(category, new Set(items));
      // Also map individual items back to category
      items.forEach((item) => {
        const cats = categories.get(item) || new Set<string>();
        cats.add(category);
        categories.set(item, cats);
      });
    };

    // Main categories
    addCategory('肉类', ['猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '鱼肉', '肉']);
    addCategory('海鲜', ['鱼', '虾', '蟹', '贝类', '鱿鱼', '墨鱼', '龙虾', '扇贝']);
    addCategory('蔬菜', ['白菜', '菠菜', '芹菜', '韭菜', '黄瓜', '番茄', '土豆', '萝卜']);
    addCategory('主食', ['米饭', '面条', '馒头', '包子', '饺子', '面包', '粥']);
    addCategory('水果', ['苹果', '香蕉', '橙子', '葡萄', '草莓', '西瓜', '梨', '桃']);
    addCategory('饮料', ['水', '茶', '咖啡', '牛奶', '豆浆', '果汁', '可乐', '啤酒']);
    addCategory('调料', ['盐', '糖', '醋', '酱油', '料酒', '花椒', '辣椒', '姜', '蒜']);
    addCategory('甜品', ['蛋糕', '饼干', '冰淇淋', '布丁', '巧克力', '糖果']);

    // Cooking method categories
    addCategory('炒菜', ['炒饭', '炒面', '炒肉', '炒蛋', '炒青菜', '爆炒']);
    addCategory('汤类', ['鸡汤', '鱼汤', '排骨汤', '蔬菜汤', '酸辣汤', '豆腐汤']);
    addCategory('烧烤', ['烤肉', '烤鸡', '烤鱼', '烤串', '烤鸭', '烤羊肉']);
    addCategory('蒸菜', ['蒸鱼', '蒸肉', '蒸蛋', '蒸包子', '蒸饺']);

    // Meal categories
    addCategory('早餐', ['包子', '馒头', '油条', '豆浆', '粥', '煎饼', '鸡蛋']);
    addCategory('午餐', ['米饭', '面条', '炒菜', '汤', '盖饭']);
    addCategory('晚餐', ['米饭', '面条', '炒菜', '汤', '火锅']);
    addCategory('夜宵', ['烧烤', '麻辣烫', '炒面', '粥', '小吃']);

    // Regional categories
    addCategory('川菜', ['麻婆豆腐', '回锅肉', '鱼香肉丝', '水煮鱼', '麻辣火锅']);
    addCategory('粤菜', ['白切鸡', '烧鹅', '叉烧', '虾饺', '肠粉']);
    addCategory('鲁菜', ['糖醋鲤鱼', '宫保鸡丁', '葱烧海参', '九转大肠']);
    addCategory('江浙菜', ['东坡肉', '西湖醋鱼', '龙井虾仁', '叫花鸡']);

    return categories;
  }

  /**
   * Get expanded query suggestions for autocomplete
   */
  getAutocompleteSuggestions(partialQuery: string, limit = 5): string[] {
    const suggestions = new Set<string>();

    // Get all possible expansions
    const expansions = this.expandQuery(partialQuery, {
      maxExpansions: limit * 3, // Get more than needed for filtering
    });

    // Filter expansions that start with the partial query
    const startsWithQuery = expansions.filter(exp =>
      exp.startsWith(partialQuery) && exp !== partialQuery,
    );

    // Add exact matches first
    startsWithQuery.forEach(s => suggestions.add(s));

    // If we need more suggestions, add related terms
    if (suggestions.size < limit) {
      expansions.forEach((exp) => {
        if (!suggestions.has(exp) && exp !== partialQuery) {
          suggestions.add(exp);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  }
}

// Export singleton instance
export const queryExpander = new ChineseQueryExpander();
