import pinyin from 'pinyin';
import type { PhoneticEncoder } from '@intake24/api/food-index/dictionary';

// Pinyin style constants
const PINYIN_STYLE_TONE = 2; // Pinyin with tone marks: pīn yīn
const PINYIN_STYLE_TONE2 = 0; // Pinyin with tone numbers: pin1 yin1
const PINYIN_STYLE_NORMAL = 3; // Pinyin without tones: pin yin
const PINYIN_STYLE_FIRST_LETTER = 4; // First letter of pinyin: p y

/**
 * Production-ready Chinese Phonetic Encoder using the pinyin library
 * Handles simplified ↔ traditional character conversions and pinyin romanization
 */
export default class ChinesePhoneticEncoder implements PhoneticEncoder {
  private readonly simplifiedToTraditional: Map<string, string>;
  private readonly traditionalToSimplified: Map<string, string>;

  constructor() {
    // Initialize conversion maps
    this.simplifiedToTraditional = this.buildSimplifiedToTraditionalMap();
    this.traditionalToSimplified = this.buildTraditionalToSimplifiedMap();
  }

  encode(input: string): Array<string> {
    const results = new Set<string>();

    // Always include original input
    results.add(input.toLowerCase());

    // Normalize and preprocess
    const preprocessed = this.preprocessChineseText(input);
    if (preprocessed !== input) {
      results.add(preprocessed.toLowerCase());
    }

    // Generate character variants (simplified/traditional)
    const variants = this.generateCharacterVariants(input);
    variants.forEach(variant => results.add(variant.toLowerCase()));

    // Generate comprehensive pinyin representations using the library
    const pinyinVariants = this.generatePinyinVariants(input);
    pinyinVariants.forEach(variant => results.add(variant.toLowerCase()));

    // Generate common alternative names
    const alternativeNames = this.generateAlternativeNames(input);
    alternativeNames.forEach(name => results.add(name.toLowerCase()));

    // Handle numeric representations
    const numericVariants = this.generateNumericVariants(input);
    numericVariants.forEach(variant => results.add(variant.toLowerCase()));

    // Apply fuzzy matching variants
    const fuzzyVariants = this.generateFuzzyVariants(input);
    fuzzyVariants.forEach(variant => results.add(variant.toLowerCase()));

    // Generate combinations for comprehensive coverage
    const currentResults = Array.from(results);
    currentResults.forEach((result) => {
      // Try character conversion on each result
      const charVariants = this.generateCharacterVariants(result);
      charVariants.forEach(variant => results.add(variant.toLowerCase()));

      // Try pinyin conversion on each result
      const pinyinVars = this.generatePinyinVariants(result);
      pinyinVars.forEach(variant => results.add(variant.toLowerCase()));
    });

    return Array.from(results);
  }

  /**
   * Preprocess Chinese text for better matching
   */
  private preprocessChineseText(input: string): string {
    let processed = input;

    // Normalize unicode
    processed = processed.normalize('NFKC');

    // Convert full-width characters to half-width
    processed = processed.replace(/[\uFF01-\uFF5E]/g, char =>
      String.fromCharCode(char.charCodeAt(0) - 0xFEE0));

    // Remove spaces between Chinese characters (use Unicode property escapes)
    processed = processed.replace(/(\p{Script=Han})(\s+)(\p{Script=Han})/gu, '$1$3');

    return processed.trim();
  }

  /**
   * Generate simplified/traditional character variants
   */
  private generateCharacterVariants(input: string): string[] {
    const variants = new Set<string>();

    // Convert to traditional
    const traditional = this.convertToTraditional(input);
    if (traditional !== input) {
      variants.add(traditional);
    }

    // Convert to simplified
    const simplified = this.convertToSimplified(input);
    if (simplified !== input) {
      variants.add(simplified);
    }

    return Array.from(variants);
  }

  /**
   * Generate comprehensive pinyin variants using the pinyin library
   */
  private generatePinyinVariants(input: string): string[] {
    const variants = new Set<string>();

    if (!pinyin) {
      return Array.from(variants);
    }

    try {
      // Generate pinyin with tone marks
      const pinyinWithTones = pinyin(input, {
        style: PINYIN_STYLE_TONE,
        heteronym: false, // Use most common pronunciation
        segment: true, // Enable word segmentation
      });
      const withTones = pinyinWithTones.map((p: string[]) => p[0]).join(' ');
      if (withTones && withTones !== input) {
        variants.add(withTones);
      }

      // Generate pinyin with tone numbers
      const pinyinWithNumbers = pinyin(input, {
        style: PINYIN_STYLE_TONE2,
        heteronym: false,
        segment: true,
      });
      const withNumbers = pinyinWithNumbers.map((p: string[]) => p[0]).join('');
      if (withNumbers && withNumbers !== input) {
        variants.add(withNumbers);
      }

      // Generate pinyin without tones
      const pinyinNoTones = pinyin(input, {
        style: PINYIN_STYLE_NORMAL,
        heteronym: false,
        segment: true,
      });
      const noTones = pinyinNoTones.map((p: string[]) => p[0]).join('');
      let spaceSeparated: string | undefined;
      if (noTones && noTones !== input) {
        variants.add(noTones);

        // Also add space-separated version
        spaceSeparated = pinyinNoTones.map((p: string[]) => p[0]).join(' ');
        if (spaceSeparated !== noTones) {
          variants.add(spaceSeparated);
        }
      }

      // Generate first letters (initials)
      const pinyinInitials = pinyin(input, {
        style: PINYIN_STYLE_FIRST_LETTER,
        heteronym: false,
        segment: true,
      });
      const firstLetters = pinyinInitials.map((p: string[]) => p[0]).join('');
      if (firstLetters && firstLetters.length > 1 && firstLetters !== input) {
        variants.add(firstLetters);
      }

      // Handle heteronyms (characters with multiple pronunciations)
      // Generate variants for common food-related heteronyms
      const heteronymVariants = this.generateHeteronymVariants(input);
      heteronymVariants.forEach(variant => variants.add(variant));

      // Common pinyin simplifications
      if (noTones) {
        // zh/ch/sh to z/c/s
        const simplified = noTones
          .replace(/zh/g, 'z')
          .replace(/ch/g, 'c')
          .replace(/sh/g, 's');
        if (simplified !== noTones) {
          variants.add(simplified);
        }

        // ng to n
        const ngSimplified = noTones.replace(/ng/g, 'n');
        if (ngSimplified !== noTones) {
          variants.add(ngSimplified);
        }

        // Generate fuzzy pinyin variants for common input errors
        const fuzzyPinyinVariants = this.generateFuzzyPinyinVariants(noTones);
        fuzzyPinyinVariants.forEach(variant => variants.add(variant));

        // Also generate fuzzy variants for space-separated version
        if (spaceSeparated && spaceSeparated !== noTones) {
          const fuzzySpacedVariants = this.generateFuzzyPinyinVariants(spaceSeparated);
          fuzzySpacedVariants.forEach(variant => variants.add(variant));
        }
      }
    }
    catch {
      // Silently handle pinyin generation errors
    }

    return Array.from(variants);
  }

  /**
   * Generate variants for characters with multiple pronunciations in food context
   */
  private generateHeteronymVariants(input: string): string[] {
    const variants = new Set<string>();

    // Common food-related heteronyms
    const heteronyms = new Map([
      ['重', ['zhòng', 'chóng']], // weight vs repeat
      ['长', ['cháng', 'zhǎng']], // long vs grow
      ['少', ['shǎo', 'shào']], // few vs young
      ['量', ['liàng', 'liáng']], // amount vs measure
      ['和', ['hé', 'huò', 'huó']], // and vs mix
      ['散', ['sàn', 'sǎn']], // disperse vs powder
      ['调', ['tiáo', 'diào']], // season vs tune
      ['炸', ['zhà', 'zhá']], // explode vs deep-fry
      ['卷', ['juǎn', 'juàn']], // roll vs volume
      ['薄', ['báo', 'bó']], // thin vs slight
    ]);

    heteronyms.forEach((pronunciations, char) => {
      if (input.includes(char)) {
        pronunciations.forEach((pron) => {
          try {
            // Generate variant with this specific pronunciation
            const variant = input.replace(char, pron);
            if (variant !== input) {
              variants.add(variant);
            }
          }
          catch {
            // Skip if replacement fails
          }
        });
      }
    });

    return Array.from(variants);
  }

  /**
   * Generate fuzzy pinyin variants for common input errors
   */
  private generateFuzzyPinyinVariants(pinyin: string): string[] {
    const variants = new Set<string>();

    // Common pinyin confusion pairs
    const confusionPairs: Array<[string, string]> = [
      // n/l confusion
      ['n', 'l'],
      ['na', 'la'],
      ['ne', 'le'],
      ['ni', 'li'],
      ['nu', 'lu'],
      ['nv', 'lv'],
      ['nan', 'lan'],
      ['nen', 'len'],
      ['nin', 'lin'],
      ['nun', 'lun'],
      ['nang', 'lang'],
      ['neng', 'leng'],
      ['ning', 'ling'],
      ['nong', 'long'],

      // zh/z, ch/c, sh/s retroflex confusion
      ['zh', 'z'],
      ['ch', 'c'],
      ['sh', 's'],
      ['zhi', 'zi'],
      ['chi', 'ci'],
      ['shi', 'si'],
      ['zha', 'za'],
      ['cha', 'ca'],
      ['sha', 'sa'],
      ['zhao', 'zao'],
      ['chao', 'cao'],
      ['shao', 'sao'],
      ['zhou', 'zou'],
      ['chou', 'cou'],
      ['shou', 'sou'],
      ['zhu', 'zu'],
      ['chu', 'cu'],
      ['shu', 'su'],

      // en/eng, in/ing nasal ending confusion
      ['en', 'eng'],
      ['in', 'ing'],
      ['un', 'ong'],
      ['ben', 'beng'],
      ['pen', 'peng'],
      ['men', 'meng'],
      ['fen', 'feng'],
      ['bin', 'bing'],
      ['pin', 'ping'],
      ['min', 'ming'],
      ['lin', 'ling'],
      ['jun', 'jiong'],
      ['qun', 'qiong'],
      ['xun', 'xiong'],

      // an/ang confusion
      ['an', 'ang'],
      ['ian', 'iang'],
      ['uan', 'uang'],
      ['ban', 'bang'],
      ['pan', 'pang'],
      ['man', 'mang'],
      ['fan', 'fang'],
      ['jian', 'jiang'],
      ['qian', 'qiang'],
      ['xian', 'xiang'],
      ['guan', 'guang'],
      ['kuan', 'kuang'],
      ['huan', 'huang'],

      // h/f confusion
      ['h', 'f'],
      ['hu', 'fu'],
      ['ha', 'fa'],
      ['hei', 'fei'],
      ['hua', 'fa'],
      ['hui', 'fei'],
      ['huo', 'fo'],

      // r/l confusion
      ['r', 'l'],
      ['re', 'le'],
      ['ri', 'li'],
      ['ru', 'lu'],
      ['ran', 'lan'],
      ['ren', 'len'],
      ['rang', 'lang'],
      ['reng', 'leng'],
      ['rou', 'lou'],
      ['ruo', 'luo'],
      ['rong', 'long'],

      // ou/o confusion
      ['ou', 'o'],
      ['hou', 'ho'],
      ['shou', 'sho'],
      ['zhou', 'zho'],

      // ü/u confusion (common when typing without proper input method)
      ['nü', 'nu'],
      ['lü', 'lu'],
      ['jü', 'ju'],
      ['qü', 'qu'],
      ['xü', 'xu'],
      ['nüe', 'nue'],
      ['lüe', 'lue'],

      // Common typos based on QWERTY keyboard layout
      ['q', 'p'],
      ['w', 'q'],
      ['w', 'e'],
      ['e', 'r'],
      ['r', 't'],
      ['a', 's'],
      ['s', 'd'],
      ['d', 'f'],
      ['g', 'h'],
      ['j', 'k'],
      ['z', 'x'],
      ['x', 'c'],
      ['c', 'v'],
      ['v', 'b'],
      ['b', 'n'],
    ];

    // Apply confusion pairs
    confusionPairs.forEach(([pattern1, pattern2]) => {
      // Try both directions of confusion
      if (pinyin.includes(pattern1)) {
        const variant1 = this.replaceWholePattern(pinyin, pattern1, pattern2);
        if (variant1 !== pinyin) {
          variants.add(variant1);
        }
      }
      if (pinyin.includes(pattern2)) {
        const variant2 = this.replaceWholePattern(pinyin, pattern2, pattern1);
        if (variant2 !== pinyin) {
          variants.add(variant2);
        }
      }
    });

    // Handle missing 'g' at the end (common typing error)
    if (pinyin.endsWith('n') && !pinyin.endsWith('ng')) {
      variants.add(`${pinyin}g`);
    }
    if (pinyin.endsWith('ng')) {
      variants.add(pinyin.slice(0, -1));
    }

    // Handle 'ue' vs 'üe' confusion
    if (pinyin.includes('ue')) {
      variants.add(pinyin.replace(/ue/g, 'üe'));
    }
    if (pinyin.includes('üe')) {
      variants.add(pinyin.replace(/üe/g, 'ue'));
    }

    // Handle 'ui' vs 'uei' / 'iu' vs 'iou' (full pinyin forms)
    if (pinyin.includes('ui')) {
      variants.add(pinyin.replace(/ui/g, 'uei'));
    }
    if (pinyin.includes('iu')) {
      variants.add(pinyin.replace(/iu/g, 'iou'));
    }

    return Array.from(variants);
  }

  /**
   * Replace pattern only if it's a whole syllable or at syllable boundaries
   */
  private replaceWholePattern(text: string, pattern: string, replacement: string): string {
    // For single character patterns, be more careful
    if (pattern.length === 1) {
      // Only replace if it's at the start or after a space/separator
      const regex = new RegExp(`(^|\\s)${pattern}(?=\\s|$|[aeiouüv])`, 'g');
      return text.replace(regex, `$1${replacement}`);
    }

    // For longer patterns, simple replacement is usually safe
    return text.replace(new RegExp(pattern, 'g'), replacement);
  }

  /**
   * Generate alternative names for common food items
   */
  private generateAlternativeNames(input: string): string[] {
    const alternatives = new Set<string>();

    // Comprehensive food name alternatives
    const nameMap = new Map([
      // Vegetables
      ['土豆', '马铃薯'],
      ['马铃薯', '土豆'],
      ['洋芋', '土豆'],
      ['洋山芋', '土豆'],
      ['番茄', '西红柿'],
      ['西红柿', '番茄'],
      ['洋柿子', '番茄'],
      ['花生', '落花生'],
      ['落花生', '花生'],
      ['长生果', '花生'],
      ['玉米', '苞米'],
      ['苞米', '玉米'],
      ['苞谷', '玉米'],
      ['棒子', '玉米'],
      ['红薯', '地瓜'],
      ['地瓜', '红薯'],
      ['番薯', '红薯'],
      ['山芋', '红薯'],
      ['黄瓜', '青瓜'],
      ['青瓜', '黄瓜'],
      ['茄子', '矮瓜'],
      ['矮瓜', '茄子'],
      ['韭菜', '起阳草'],
      ['起阳草', '韭菜'],

      // Meat
      ['猪肉', '豚肉'],
      ['豚肉', '猪肉'],
      ['牛肉', '黄牛肉'],
      ['水牛肉', '牛肉'],
      ['鸡肉', '鸡'],
      ['鸡', '鸡肉'],

      // Seafood
      ['明虾', '对虾'],
      ['对虾', '明虾'],
      ['大虾', '对虾'],
      ['鱿鱼', '枪乌贼'],
      ['枪乌贼', '鱿鱼'],
      ['柔鱼', '鱿鱼'],
      ['带鱼', '刀鱼'],
      ['刀鱼', '带鱼'],
      ['牙带鱼', '带鱼'],
      ['墨鱼', '乌贼'],
      ['乌贼', '墨鱼'],
      ['花枝', '墨鱼'],

      // Dishes
      ['红烧肉', '东坡肉'],
      ['东坡肉', '红烧肉'],
      ['毛氏红烧肉', '红烧肉'],
      ['馄饨', '云吞'],
      ['云吞', '馄饨'],
      ['抄手', '馄饨'],
      ['扁食', '馄饨'],
      ['汤圆', '元宵'],
      ['元宵', '汤圆'],
      ['圆子', '汤圆'],
      ['粽子', '角黍'],
      ['角黍', '粽子'],
      ['筒粽', '粽子'],
      ['包子', '馒头'],
      ['馒头', '包子'], // In some regions
      ['油条', '油炸鬼'],
      ['油炸鬼', '油条'],
      ['油炸桧', '油条'],
      ['豆腐脑', '豆花'],
      ['豆花', '豆腐脑'],
      ['豆腐花', '豆腐脑'],

      // Beverages
      ['豆浆', '豆奶'],
      ['豆奶', '豆浆'],
      ['豆乳', '豆浆'],
      ['白开水', '开水'],
      ['开水', '白开水'],
      ['凉白开', '白开水'],
      ['汽水', '碳酸饮料'],
      ['碳酸饮料', '汽水'],
      ['汽儿', '汽水'],

      // Grains
      ['大米', '稻米'],
      ['稻米', '大米'],
      ['白米', '大米'],
      ['小麦', '麦子'],
      ['麦子', '小麦'],
      ['高粱', '蜀黍'],
      ['蜀黍', '高粱'],
    ]);

    // Check if input contains any alternative names
    nameMap.forEach((alternative, original) => {
      if (input.includes(original)) {
        const replaced = input.replace(original, alternative);
        alternatives.add(replaced);
      }
    });

    // Regional variations
    this.addRegionalVariations(input, alternatives);

    return Array.from(alternatives);
  }

  /**
   * Add regional name variations
   */
  private addRegionalVariations(input: string, alternatives: Set<string>): void {
    const regionalMap = new Map([
      // Northern vs Southern
      ['馒头', '馍馍'],
      ['馍馍', '馒头'],
      ['馍', '馒头'],
      ['面条', '面'],
      ['面', '面条'],
      ['饺子', '扁食'],
      ['扁食', '饺子'],

      // Cantonese variations
      ['叉烧', '叉烧肉'],
      ['叉烧肉', '叉烧'],
      ['叉烧包', '叉烧馒头'],
      ['烧卖', '烧麦'],
      ['烧麦', '烧卖'],
      ['稍麦', '烧卖'],
      ['肠粉', '拉肠'],
      ['拉肠', '肠粉'],
      ['布拉肠', '肠粉'],
      ['虾饺', '虾饺子'],
      ['虾饺子', '虾饺'],

      // Sichuan variations
      ['抄手', '馄饨'],
      ['红油抄手', '红油馄饨'],
      ['担担面', '担挑面'],
      ['担挑面', '担担面'],

      // Shanghai variations
      ['小笼包', '小笼馒头'],
      ['小笼馒头', '小笼包'],
      ['汤包', '小笼包'],
      ['生煎', '生煎馒头'],
      ['生煎馒头', '生煎'],
      ['生煎包', '生煎'],
    ]);

    regionalMap.forEach((alternative, original) => {
      if (input.includes(original)) {
        const replaced = input.replace(original, alternative);
        alternatives.add(replaced);
      }
    });
  }

  /**
   * Generate numeric variants (Chinese numbers to Arabic numerals)
   */
  private generateNumericVariants(input: string): string[] {
    const variants = new Set<string>();

    // Comprehensive number mapping
    const numberMap = new Map([
      ['零', '0'],
      ['一', '1'],
      ['二', '2'],
      ['三', '3'],
      ['四', '4'],
      ['五', '5'],
      ['六', '6'],
      ['七', '7'],
      ['八', '8'],
      ['九', '9'],
      ['十', '10'],
      ['百', '100'],
      ['千', '1000'],
      ['万', '10000'],
      ['两', '2'],
      ['俩', '2'],
      ['双', '2'],
      ['对', '2'],
      ['副', '2'],
      ['半', '0.5'],
      ['半个', '0.5'],
      ['一半', '0.5'],
      ['壹', '1'],
      ['贰', '2'],
      ['叁', '3'],
      ['肆', '4'],
      ['伍', '5'],
      ['陆', '6'],
      ['柒', '7'],
      ['捌', '8'],
      ['玖', '9'],
      ['拾', '10'],
      ['佰', '100'],
      ['仟', '1000'],
      ['萬', '10000'],
      ['億', '100000000'],
    ]);

    // First, try to parse complex Chinese numbers
    const complexNumberVariant = this.parseComplexChineseNumber(input);
    if (complexNumberVariant !== input) {
      variants.add(complexNumberVariant);
    }

    // First pass: simple replacements
    let hasNumber = false;
    let numericVariant = input;

    numberMap.forEach((arabic, chinese) => {
      if (input.includes(chinese)) {
        hasNumber = true;
        numericVariant = numericVariant.replace(new RegExp(chinese, 'g'), arabic);
      }
    });

    if (hasNumber && numericVariant !== input) {
      variants.add(numericVariant);

      // Also add variant without spaces
      variants.add(numericVariant.replace(/(\d+)\s*(\p{Script=Han})/gu, '$1$2'));
      variants.add(numericVariant.replace(/(\p{Script=Han})\s*(\d+)/gu, '$1$2'));
    }

    // Handle compound numbers (e.g., 二十 -> 20, 三百 -> 300)
    const compoundPatterns = [
      // Tens
      { pattern: /一十/, replacement: '10' },
      { pattern: /二十/, replacement: '20' },
      { pattern: /两十/, replacement: '20' },
      { pattern: /三十/, replacement: '30' },
      { pattern: /四十/, replacement: '40' },
      { pattern: /五十/, replacement: '50' },
      { pattern: /六十/, replacement: '60' },
      { pattern: /七十/, replacement: '70' },
      { pattern: /八十/, replacement: '80' },
      { pattern: /九十/, replacement: '90' },

      // Hundreds
      { pattern: /一百/, replacement: '100' },
      { pattern: /两百/, replacement: '200' },
      { pattern: /二百/, replacement: '200' },
      { pattern: /三百/, replacement: '300' },
      { pattern: /四百/, replacement: '400' },
      { pattern: /五百/, replacement: '500' },
      { pattern: /六百/, replacement: '600' },
      { pattern: /七百/, replacement: '700' },
      { pattern: /八百/, replacement: '800' },
      { pattern: /九百/, replacement: '900' },

      // Thousands
      { pattern: /一千/, replacement: '1000' },
      { pattern: /两千/, replacement: '2000' },
      { pattern: /二千/, replacement: '2000' },
      { pattern: /三千/, replacement: '3000' },
      { pattern: /四千/, replacement: '4000' },
      { pattern: /五千/, replacement: '5000' },
      { pattern: /六千/, replacement: '6000' },
      { pattern: /七千/, replacement: '7000' },
      { pattern: /八千/, replacement: '8000' },
      { pattern: /九千/, replacement: '9000' },

      // Common fractions in cooking
      { pattern: /四分之一/, replacement: '0.25' },
      { pattern: /四分一/, replacement: '0.25' },
      { pattern: /三分之一/, replacement: '0.33' },
      { pattern: /三分一/, replacement: '0.33' },
      { pattern: /三分之二/, replacement: '0.67' },
      { pattern: /三分二/, replacement: '0.67' },
      { pattern: /四分之三/, replacement: '0.75' },
      { pattern: /四分三/, replacement: '0.75' },
      { pattern: /五分之一/, replacement: '0.2' },
      { pattern: /五分一/, replacement: '0.2' },
      { pattern: /十分之一/, replacement: '0.1' },
      { pattern: /十分一/, replacement: '0.1' },

      // Mixed numbers
      { pattern: /一个半/, replacement: '1.5' },
      { pattern: /两个半/, replacement: '2.5' },
      { pattern: /三个半/, replacement: '3.5' },
      { pattern: /一斤半/, replacement: '1.5斤' },
      { pattern: /两斤半/, replacement: '2.5斤' },
    ];

    compoundPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(input)) {
        const variant = input.replace(pattern, replacement);
        variants.add(variant);
      }
    });

    // Handle special number + measure word combinations
    if (input.match(/[一二三四五六七八九十两半]+([斤两克升个只条片碗盘杯勺匙]|千克|公斤|毫升)/)) {
      // Try to convert numbers while preserving measure words
      let processedInput = input;
      const chineseToArabic = {
        一: '1',
        二: '2',
        三: '3',
        四: '4',
        五: '5',
        六: '6',
        七: '7',
        八: '8',
        九: '9',
        十: '10',
        两: '2',
        半: '0.5',
      };

      Object.entries(chineseToArabic).forEach(([chinese, arabic]) => {
        // Only replace numbers that are followed by measure words
        const regex = new RegExp(`${chinese}(?=[斤两克千克公斤毫升升个只条片碗盘杯勺匙])`, 'g');
        processedInput = processedInput.replace(regex, arabic);
      });

      if (processedInput !== input) {
        variants.add(processedInput);
      }
    }

    return Array.from(variants);
  }

  /**
   * Parse complex Chinese numbers like "二十三" -> "23", "一百二十五" -> "125"
   */
  private parseComplexChineseNumber(input: string): string {
    // Regular expression to match Chinese number sequences
    const chineseNumberRegex = /[零一二三四五六七八九十百千万两壹贰叁肆伍陆柒捌玖拾佰仟萬億]+/g;

    return input.replace(chineseNumberRegex, (match) => {
      try {
        const arabicNumber = this.convertChineseToArabic(match);
        return arabicNumber !== null ? arabicNumber.toString() : match;
      }
      catch {
        return match;
      }
    });
  }

  /**
   * Convert a Chinese number string to Arabic number
   */
  private convertChineseToArabic(chinese: string): number | null {
    if (!chinese || chinese.length === 0)
      return null;

    // Character to number mapping
    const digitMap: { [key: string]: number } = {
      零: 0,
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      两: 2,
      壹: 1,
      贰: 2,
      叁: 3,
      肆: 4,
      伍: 5,
      陆: 6,
      柒: 7,
      捌: 8,
      玖: 9,
    };

    const unitMap: { [key: string]: number } = {
      十: 10,
      拾: 10,
      百: 100,
      佰: 100,
      千: 1000,
      仟: 1000,
      万: 10000,
      萬: 10000,
      亿: 100000000,
      億: 100000000,
    };

    // Handle simple single digit
    if (chinese.length === 1 && chinese in digitMap) {
      return digitMap[chinese];
    }

    // Handle simple units like "十", "百"
    if (chinese.length === 1 && chinese in unitMap) {
      return unitMap[chinese];
    }

    let result = 0;
    let temp = 0;
    let currentUnit = 1;

    // Parse from right to left
    for (let i = chinese.length - 1; i >= 0; i--) {
      const char = chinese[i];

      if (char in digitMap) {
        if (currentUnit >= 10000) {
          // Handle 万/亿 level numbers
          result += temp * currentUnit;
          temp = digitMap[char];
          currentUnit = 1;
        }
        else {
          temp = digitMap[char] * currentUnit + temp;
        }
      }
      else if (char in unitMap) {
        const unit = unitMap[char];
        if (unit >= 10000) {
          // 万 or 亿
          result += (temp || 1) * unit;
          temp = 0;
          currentUnit = 1;
        }
        else {
          if (i === 0 && temp === 0) {
            // Handle cases like "十" meaning "10"
            temp = 1;
          }
          currentUnit = unit;
        }
      }
    }

    result += temp;

    // Handle special cases
    if (chinese === '十')
      return 10;
    if (chinese.startsWith('十')) {
      // "十五" -> 15
      const remaining = chinese.substring(1);
      if (remaining in digitMap) {
        return 10 + digitMap[remaining];
      }
    }

    return result > 0 ? result : null;
  }

  /**
   * Generate fuzzy variants for better matching tolerance
   */
  private generateFuzzyVariants(input: string): string[] {
    const variants = new Set<string>();

    // Remove common measure words for fuzzy matching
    const measureWords = [
      '个',
      '只',
      '条',
      '块',
      '片',
      '碗',
      '盘',
      '份',
      '斤',
      '两',
      '克',
      '千克',
      '公斤',
      '毫升',
      '升',
      '瓶',
      '罐',
      '袋',
      '盒',
      '包',
      '串',
      '把',
      '根',
      '支',
      '颗',
      '粒',
      '滴',
      '勺',
      '匙',
      '杯',
      '壶',
    ];

    measureWords.forEach((measure) => {
      if (input.includes(measure)) {
        const variant = input.replace(new RegExp(measure, 'g'), '').trim();
        if (variant.length > 0 && variant !== input) {
          variants.add(variant);
        }
      }
    });

    // Handle erhua (儿化音)
    if (input.endsWith('儿')) {
      variants.add(input.slice(0, -1));
    }
    else if (input.length <= 3 && !input.endsWith('儿')) {
      variants.add(`${input}儿`);
    }

    // Handle "子" suffix variations
    if (input.endsWith('子')) {
      const withoutZi = input.slice(0, -1);
      if (withoutZi.length > 0) {
        variants.add(withoutZi);
      }
    }

    // Common character variations and typos
    const charVariations = new Map([
      ['鸡', '鷄'],
      ['鷄', '鸡'],
      ['蛋', '旦'],
      ['旦', '蛋'],
      ['面', '麺'],
      ['麺', '面'],
      ['卤', '滷'],
      ['滷', '卤'],
      ['凉', '涼'],
      ['涼', '凉'],
      ['酸', '痠'],
      ['痠', '酸'],
    ]);

    charVariations.forEach((replacement, original) => {
      if (input.includes(original)) {
        const variant = input.replace(new RegExp(original, 'g'), replacement);
        variants.add(variant);
      }
    });

    return Array.from(variants);
  }

  /**
   * Convert to traditional Chinese characters
   */
  private convertToTraditional(input: string): string {
    return input.split('').map(char =>
      this.simplifiedToTraditional.get(char) || char,
    ).join('');
  }

  /**
   * Convert to simplified Chinese characters
   */
  private convertToSimplified(input: string): string {
    return input.split('').map(char =>
      this.traditionalToSimplified.get(char) || char,
    ).join('');
  }

  /**
   * Build simplified to traditional character mapping
   */
  private buildSimplifiedToTraditionalMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Comprehensive food-related character mappings
    const pairs: [string, string][] = [
      // Food ingredients
      ['鸡', '雞'],
      ['鸭', '鴨'],
      ['鹅', '鵝'],
      ['鸽', '鴿'],
      ['鱼', '魚'],
      ['虾', '蝦'],
      ['蟹', '蟹'],
      ['贝', '貝'],
      ['猪', '豬'],
      ['马', '馬'],
      ['驴', '驢'],
      ['骡', '騾'],
      ['鸟', '鳥'],
      ['龟', '龜'],
      ['鳖', '鱉'],
      ['蛙', '蛙'],
      ['虫', '蟲'],
      ['蚕', '蠶'],
      ['蜂', '蜂'],
      ['蝉', '蟬'],

      // Vegetables
      ['萝', '蘿'],
      ['卜', '蔔'],
      ['笋', '筍'],
      ['茎', '莖'],
      ['叶', '葉'],
      ['芦', '蘆'],
      ['荟', '薈'],
      ['莲', '蓮'],
      ['藕', '藕'],
      ['韭', '韭'],
      ['葱', '蔥'],
      ['姜', '薑'],
      ['蒜', '蒜'],
      ['辣', '辣'],
      ['椒', '椒'],
      ['芜', '蕪'],

      // Grains and products
      ['面', '麵'],
      ['麦', '麥'],
      ['谷', '穀'],
      ['糠', '糠'],
      ['饭', '飯'],
      ['粥', '粥'],
      ['饼', '餅'],
      ['馒', '饅'],
      ['饺', '餃'],
      ['馄', '餛'],
      ['饨', '飩'],
      ['团', '團'],
      ['粽', '粽'],
      ['糍', '餈'],
      ['馍', '饃'],
      ['烧', '燒'],

      // Cooking related
      ['锅', '鍋'],
      ['铲', '鏟'],
      ['钳', '鉗'],
      ['铁', '鐵'],
      ['铜', '銅'],
      ['铝', '鋁'],
      ['钢', '鋼'],
      ['银', '銀'],
      ['盘', '盤'],
      ['碗', '碗'],
      ['筷', '筷'],
      ['勺', '勺'],
      ['罐', '罐'],
      ['坛', '罈'],
      ['缸', '缸'],
      ['瓮', '甕'],

      // Cooking methods
      ['烧', '燒'],
      ['烩', '燴'],
      ['烤', '烤'],
      ['焖', '燜'],
      ['炖', '燉'],
      ['卤', '滷'],
      ['腌', '醃'],
      ['熏', '燻'],
      ['酿', '釀'],
      ['蒸', '蒸'],
      ['煮', '煮'],
      ['炸', '炸'],
      ['爆', '爆'],
      ['熘', '熘'],
      ['焗', '焗'],
      ['烘', '烘'],

      // Flavors and seasonings
      ['盐', '鹽'],
      ['糖', '糖'],
      ['醋', '醋'],
      ['酱', '醬'],
      ['酿', '釀'],
      ['腊', '臘'],
      ['咸', '鹹'],
      ['淡', '淡'],
      ['鲜', '鮮'],
      ['浓', '濃'],
      ['稠', '稠'],
      ['稀', '稀'],

      // Common characters
      ['国', '國'],
      ['学', '學'],
      ['会', '會'],
      ['体', '體'],
      ['医', '醫'],
      ['东', '東'],
      ['车', '車'],
      ['红', '紅'],
      ['绿', '綠'],
      ['蓝', '藍'],
      ['黄', '黃'],
      ['紫', '紫'],
      ['爱', '愛'],
      ['门', '門'],
      ['开', '開'],
      ['关', '關'],
      ['时', '時'],
      ['间', '間'],
      ['电', '電'],
      ['号', '號'],
      ['长', '長'],
      ['万', '萬'],
      ['与', '與'],
      ['个', '個'],
      ['为', '為'],
      ['来', '來'],
      ['发', '發'],
      ['说', '說'],
      ['经', '經'],
      ['对', '對'],
      ['头', '頭'],
      ['儿', '兒'],

      // Food establishments
      ['饭', '飯'],
      ['馆', '館'],
      ['厅', '廳'],
      ['楼', '樓'],
      ['店', '店'],
      ['庄', '莊'],
      ['园', '園'],
      ['轩', '軒'],
      ['阁', '閣'],
      ['斋', '齋'],
      ['居', '居'],
      ['苑', '苑'],

      // Additional food terms
      ['丝', '絲'],
      ['块', '塊'],
      ['条', '條'],
      ['颗', '顆'],
      ['质', '質'],
      ['营', '營'],
      ['养', '養'],
      ['维', '維'],
      ['纤', '纖'],
      ['钙', '鈣'],
      ['铁', '鐵'],
      ['锌', '鋅'],
      ['镁', '鎂'],
      ['钾', '鉀'],
      ['钠', '鈉'],
      ['磷', '磷'],
    ];

    pairs.forEach(([simplified, traditional]) => {
      map.set(simplified, traditional);
    });

    return map;
  }

  /**
   * Build traditional to simplified character mapping
   */
  private buildTraditionalToSimplifiedMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Reverse the simplified-to-traditional mappings
    this.simplifiedToTraditional.forEach((traditional, simplified) => {
      map.set(traditional, simplified);
    });

    return map;
  }
}
