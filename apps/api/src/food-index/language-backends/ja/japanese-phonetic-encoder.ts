import type { PhoneticEncoder } from '@intake24/api/food-index/dictionary';

import { getReading, isTokenizerReady } from './japanese-language-backend';

/**
 * Japanese Phonetic Encoder for cross-script matching
 * Handles hiragana ↔ katakana ↔ romaji conversions
 * Uses Kuromoji tokenizer for dynamic kanji→kana conversion
 */
export default class JapanesePhoneticEncoder implements PhoneticEncoder {
  private readonly hiraganaToKatakana: Map<string, string>;
  private readonly katakanaToHiragana: Map<string, string>;
  private readonly romajiToHiragana: Map<string, string>;

  constructor() {
    // Initialize conversion maps
    this.hiraganaToKatakana = this.buildHiraganaToKatakanaMap();
    this.katakanaToHiragana = this.buildKatakanaToHiraganaMap();
    this.romajiToHiragana = this.buildRomajiToHiraganaMap();
  }

  encode(input: string): Array<string> {
    const results = new Set<string>();

    // Phase 2: Smart preprocessing and normalization
    const preprocessed = this.preprocessJapaneseText(input);

    // Always include original input and preprocessed versions
    results.add(input.toLowerCase());
    if (preprocessed !== input) {
      results.add(preprocessed.toLowerCase());
    }

    // Apply base form extraction for better morphological matching
    const baseForms = this.extractBaseForms(preprocessed);
    baseForms.forEach(form => results.add(form.toLowerCase()));

    // Apply compound word splitting for better matching
    const compoundParts = this.splitCompoundTerms(preprocessed);
    compoundParts.forEach(part => results.add(part.toLowerCase()));

    // Handle honorific prefixes for traditional Japanese foods
    const honorificVariants = this.handleHonorificPrefix(preprocessed);
    honorificVariants.forEach(variant => results.add(variant.toLowerCase()));

    // Generate reading-based variants for fuzzy matching
    const readingVariants = this.generateReadingVariants(preprocessed);
    readingVariants.forEach(variant => results.add(variant.toLowerCase()));

    // Convert kanji to kana first
    const kanaFromKanji = this.convertKanjiToKana(input);
    if (kanaFromKanji !== input) {
      results.add(kanaFromKanji);
      // Also convert the kana result to katakana
      const katakanaFromKanji = this.convertHiraganaToKatakana(kanaFromKanji);
      if (katakanaFromKanji !== kanaFromKanji) {
        results.add(katakanaFromKanji);
      }
    }

    // Convert hiragana to katakana
    const katakanaVersion = this.convertHiraganaToKatakana(input);
    if (katakanaVersion !== input) {
      results.add(katakanaVersion);
    }

    // Convert katakana to hiragana
    const hiraganaVersion = this.convertKatakanaToHiragana(input);
    if (hiraganaVersion !== input) {
      results.add(hiraganaVersion);
    }

    // Convert romaji to hiragana
    const hiraganaFromRomaji = this.convertRomajiToHiragana(input);
    if (hiraganaFromRomaji !== input) {
      results.add(hiraganaFromRomaji);
      // Also add katakana version of romaji conversion
      const katakanaFromRomaji = this.convertHiraganaToKatakana(hiraganaFromRomaji);
      results.add(katakanaFromRomaji);
    }

    // Convert to romaji approximation (for common food terms)
    const romajiApprox = this.convertToRomajiApprox(input);
    if (romajiApprox !== input) {
      results.add(romajiApprox);
    }

    // Apply fuzzy matching variants for better recall
    const fuzzyVariants = this.generateFuzzyVariants(input);
    fuzzyVariants.forEach(variant => results.add(variant));

    // Apply conversions to all generated results for comprehensive coverage
    const allResults = Array.from(results);
    allResults.forEach((result) => {
      // Try kanji conversion on each result
      const kanjiConversion = this.convertKanjiToKana(result);
      if (kanjiConversion !== result) {
        results.add(kanjiConversion);
        const katakanaFromKanjiConversion = this.convertHiraganaToKatakana(kanjiConversion);
        if (katakanaFromKanjiConversion !== kanjiConversion) {
          results.add(katakanaFromKanjiConversion);
        }
      }

      // Try romaji conversion on each result
      const romajiConversion = this.convertToRomajiApprox(result);
      if (romajiConversion !== result) {
        results.add(romajiConversion);
      }
    });

    return Array.from(results);
  }

  /**
   * Handle honorific prefixes in Japanese food terms
   * Example: お寿司 → [お寿司, 寿司]
   */
  private handleHonorificPrefix(input: string): string[] {
    const variants = new Set<string>();

    // Handle お prefix (most common honorific for food)
    if (input.startsWith('お')) {
      const withoutPrefix = input.substring(1);
      variants.add(withoutPrefix);

      // Also try conversions on the base form
      const kanaConversion = this.convertKanjiToKana(withoutPrefix);
      if (kanaConversion !== withoutPrefix) {
        variants.add(kanaConversion);
      }
    }
    else {
      // Generate honorific version for common traditional foods
      const traditionalFoods = ['寿司', 'すし', '茶', 'ちゃ', '米', 'こめ', '箸', 'はし', '酒', 'さけ'];
      if (traditionalFoods.some(food => input.includes(food))) {
        variants.add(`お${input}`);
      }
    }

    return Array.from(variants);
  }

  private buildHiraganaToKatakanaMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Basic hiragana to katakana mapping
    const pairs = [
      ['あ', 'ア'],
      ['い', 'イ'],
      ['う', 'ウ'],
      ['え', 'エ'],
      ['お', 'オ'],
      ['か', 'カ'],
      ['き', 'キ'],
      ['く', 'ク'],
      ['け', 'ケ'],
      ['こ', 'コ'],
      ['が', 'ガ'],
      ['ぎ', 'ギ'],
      ['ぐ', 'グ'],
      ['げ', 'ゲ'],
      ['ご', 'ゴ'],
      ['さ', 'サ'],
      ['し', 'シ'],
      ['す', 'ス'],
      ['せ', 'セ'],
      ['そ', 'ソ'],
      ['ざ', 'ザ'],
      ['じ', 'ジ'],
      ['ず', 'ズ'],
      ['ぜ', 'ゼ'],
      ['ぞ', 'ゾ'],
      ['た', 'タ'],
      ['ち', 'チ'],
      ['つ', 'ツ'],
      ['て', 'テ'],
      ['と', 'ト'],
      ['だ', 'ダ'],
      ['ぢ', 'ヂ'],
      ['づ', 'ヅ'],
      ['で', 'デ'],
      ['ど', 'ド'],
      ['な', 'ナ'],
      ['に', 'ニ'],
      ['ぬ', 'ヌ'],
      ['ね', 'ネ'],
      ['の', 'ノ'],
      ['は', 'ハ'],
      ['ひ', 'ヒ'],
      ['ふ', 'フ'],
      ['へ', 'ヘ'],
      ['ほ', 'ホ'],
      ['ば', 'バ'],
      ['び', 'ビ'],
      ['ぶ', 'ブ'],
      ['べ', 'ベ'],
      ['ぼ', 'ボ'],
      ['ぱ', 'パ'],
      ['ぴ', 'ピ'],
      ['ぷ', 'プ'],
      ['ぺ', 'ペ'],
      ['ぽ', 'ポ'],
      ['ま', 'マ'],
      ['み', 'ミ'],
      ['む', 'ム'],
      ['め', 'メ'],
      ['も', 'モ'],
      ['や', 'ヤ'],
      ['ゆ', 'ユ'],
      ['よ', 'ヨ'],
      ['ら', 'ラ'],
      ['り', 'リ'],
      ['る', 'ル'],
      ['れ', 'レ'],
      ['ろ', 'ロ'],
      ['わ', 'ワ'],
      ['ゐ', 'ヰ'],
      ['ゑ', 'ヱ'],
      ['を', 'ヲ'],
      ['ん', 'ン'],
      ['ー', 'ー'],
      ['っ', 'ッ'],
    ];

    pairs.forEach(([hiragana, katakana]) => {
      map.set(hiragana, katakana);
    });

    return map;
  }

  private buildKatakanaToHiraganaMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Reverse of hiragana to katakana
    this.hiraganaToKatakana.forEach((katakana, hiragana) => {
      map.set(katakana, hiragana);
    });

    return map;
  }

  private buildRomajiToHiraganaMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Comprehensive romaji to hiragana/katakana conversions for Japanese food terms
    const pairs = [
      // Meat and protein
      ['tori', 'とり'],
      ['chicken', 'チキン'],
      ['gyuu', 'ぎゅう'],
      ['beef', 'ビーフ'],
      ['buta', 'ぶた'],
      ['pork', 'ポーク'],
      ['sakana', 'さかな'],
      ['fish', 'フィッシュ'],
      ['niku', 'にく'],
      ['meat', 'ミート'],
      ['ebi', 'えび'],
      ['shrimp', 'シュリンプ'],
      ['kani', 'かに'],
      ['crab', 'クラブ'],
      ['tako', 'たこ'],
      ['octopus', 'オクトパス'],
      ['ika', 'いか'],
      ['squid', 'スクイッド'],
      ['sake', 'さけ'],
      ['salmon', 'サーモン'],
      ['maguro', 'まぐろ'],
      ['tuna', 'ツナ'],
      ['tai', 'たい'],
      ['sea bream', 'シーブリーム'],
      ['aji', 'あじ'],
      ['horse mackerel', 'アジ'],
      ['saba', 'さば'],
      ['mackerel', 'マッカレル'],
      ['tamago', 'たまご'],
      ['egg', 'エッグ'],
      ['tofu', 'とうふ'],
      ['tofu', 'トーフ'],

      // Vegetables and fruits
      ['yasai', 'やさい'],
      ['vegetable', 'ベジタブル'],
      ['kyabetsu', 'キャベツ'],
      ['cabbage', 'キャベツ'],
      ['hakusai', 'はくさい'],
      ['chinese cabbage', 'チャイニーズキャベツ'],
      ['daikon', 'だいこん'],
      ['radish', 'ラディッシュ'],
      ['ninjin', 'にんじん'],
      ['carrot', 'キャロット'],
      ['tamanegi', 'たまねぎ'],
      ['onion', 'オニオン'],
      ['jagaimo', 'じゃがいも'],
      ['potato', 'ポテト'],
      ['imo', 'いも'],
      ['potato', 'ポテト'],
      ['tomato', 'トマト'],
      ['tomato', 'トマト'],
      ['kyuuri', 'きゅうり'],
      ['cucumber', 'キューカンバー'],
      ['piiman', 'ピーマン'],
      ['bell pepper', 'ベルペッパー'],
      ['moyashi', 'もやし'],
      ['bean sprouts', 'ビーンスプラウト'],
      ['ringo', 'りんご'],
      ['apple', 'アップル'],
      ['mikan', 'みかん'],
      ['orange', 'オレンジ'],
      ['ichigo', 'いちご'],
      ['strawberry', 'ストロベリー'],
      ['banana', 'バナナ'],
      ['banana', 'バナナ'],
      ['budou', 'ぶどう'],
      ['grape', 'グレープ'],
      ['momo', 'もも'],
      ['peach', 'ピーチ'],
      ['nashi', 'なし'],
      ['pear', 'ペアー'],

      // Grains and starches
      ['gohan', 'ごはん'],
      ['rice', 'ライス'],
      ['kome', 'こめ'],
      ['rice', 'ライス'],
      ['pan', 'パン'],
      ['bread', 'ブレッド'],
      ['men', 'めん'],
      ['noodles', 'ヌードル'],
      ['pasta', 'パスタ'],
      ['pasta', 'パスタ'],
      ['soba', 'そば'],
      ['buckwheat noodles', 'ソバ'],
      ['udon', 'うどん'],
      ['udon noodles', 'ウドン'],
      ['ramen', 'らーめん'],
      ['ramen', 'ラーメン'],
      ['somen', 'そうめん'],
      ['thin noodles', 'ソーメン'],

      // Popular dishes
      ['sushi', 'すし'],
      ['sushi', 'スシ'],
      ['sushi', '寿司'],
      ['sushi', '鮨'],
      ['nigiri', 'にぎり'],
      ['nigiri sushi', 'にぎり寿司'],
      ['nigiri sushi', '握り寿司'],
      ['sashimi', 'さしみ'],
      ['sashimi', 'サシミ'],
      ['tempura', 'てんぷら'],
      ['tempura', 'テンプラ'],
      ['tonkatsu', 'とんかつ'],
      ['pork cutlet', 'ポークカツレツ'],
      ['yakitori', 'やきとり'],
      ['grilled chicken', 'グリルドチキン'],
      ['teriyaki', 'てりやき'],
      ['teriyaki', 'テリヤキ'],
      ['sukiyaki', 'すきやき'],
      ['sukiyaki', 'スキヤキ'],
      ['shabu', 'しゃぶ'],
      ['shabu shabu', 'シャブシャブ'],
      ['yakisoba', 'やきそば'],
      ['fried noodles', 'フライドヌードル'],
      ['okonomiyaki', 'おこのみやき'],
      ['savory pancake', 'オコノミヤキ'],
      ['takoyaki', 'たこやき'],
      ['octopus balls', 'タコヤキ'],
      ['onigiri', 'おにぎり'],
      ['rice ball', 'ライスボール'],
      ['bento', 'べんとう'],
      ['lunch box', 'ランチボックス'],
      ['donburi', 'どんぶり'],
      ['rice bowl', 'ライスボウル'],
      ['oyakodon', 'おやこどん'],
      ['chicken and egg bowl', 'チキンエッグボウル'],
      ['katsudon', 'かつどん'],
      ['pork cutlet bowl', 'ポークカツレツボウル'],
      ['gyudon', 'ぎゅうどん'],
      ['beef bowl', 'ビーフボウル'],
      ['chirashi', 'ちらし'],
      ['scattered sushi', 'チラシ'],

      // Curry and stews
      ['kare', 'かれー'],
      ['curry', 'カレー'],
      ['curry', 'カレー'],
      ['curry', 'カレー'],
      ['hayashi', 'はやし'],
      ['hayashi rice', 'ハヤシライス'],
      ['nikujaga', 'にくじゃが'],
      ['meat and potatoes', 'ミートアンドポテト'],

      // Soups
      ['miso', 'みそ'],
      ['miso', 'ミソ'],
      ['supu', 'スープ'],
      ['soup', 'スープ'],
      ['shiru', 'しる'],
      ['soup', 'スープ'],
      ['shirumono', 'しるもの'],
      ['soup dish', 'スープディッシュ'],
      ['dashi', 'だし'],
      ['broth', 'ブロス'],

      // Sweets and desserts
      ['chokoreto', 'チョコレート'],
      ['chocolate', 'チョコレート'],
      ['choko', 'チョコ'],
      ['chocolate', 'チョコレート'],
      ['keki', 'ケーキ'],
      ['cake', 'ケーキ'],
      ['aisukurimu', 'アイスクリーム'],
      ['ice cream', 'アイスクリーム'],
      ['aisu', 'アイス'],
      ['ice cream', 'アイスクリーム'],
      ['purin', 'プリン'],
      ['pudding', 'プディング'],
      ['yokan', 'ようかん'],
      ['sweet jelly', 'ヨウカン'],
      ['mochi', 'もち'],
      ['rice cake', 'ライスケーキ'],
      ['dango', 'だんご'],
      ['dumpling', 'ダンプリング'],
      ['taiyaki', 'たいやき'],
      ['fish-shaped pastry', 'タイヤキ'],
      ['dorayaki', 'どらやき'],
      ['pancake sandwich', 'ドラヤキ'],

      // Beverages
      ['cha', 'ちゃ'],
      ['tea', 'ティー'],
      ['ocha', 'おちゃ'],
      ['tea', 'ティー'],
      ['kocha', 'こうちゃ'],
      ['black tea', 'ブラックティー'],
      ['matcha', 'まっちゃ'],
      ['green tea', 'グリーンティー'],
      ['koohii', 'コーヒー'],
      ['coffee', 'コーヒー'],
      ['coffee', 'コーヒー'],
      ['coffee', 'コーヒー'],
      ['juusu', 'ジュース'],
      ['juice', 'ジュース'],
      ['juice', 'ジュース'],
      ['juice', 'ジュース'],
      ['mizu', 'みず'],
      ['water', 'ウォーター'],
      ['biiru', 'ビール'],
      ['beer', 'ビール'],
      ['sake', 'さけ'],
      ['sake', 'サケ'],
      ['wine', 'ワイン'],
      ['wine', 'ワイン'],

      // Cooking methods
      ['yaki', 'やき'],
      ['grilled', 'グリル'],
      ['nabe', 'なべ'],
      ['hot pot', 'ホットポット'],
      ['itame', 'いため'],
      ['stir-fry', 'スターフライ'],
      ['age', 'あげ'],
      ['deep-fried', 'ディープフライ'],
      ['ni', 'に'],
      ['simmered', 'シマード'],
      ['mushi', 'むし'],
      ['steamed', 'スチーム'],
      ['yude', 'ゆで'],
      ['boiled', 'ボイルド'],

      // Common food descriptors
      ['oishii', 'おいしい'],
      ['delicious', 'デリシャス'],
      ['atsui', 'あつい'],
      ['hot', 'ホット'],
      ['tsumetai', 'つめたい'],
      ['cold', 'コールド'],
      ['amai', 'あまい'],
      ['sweet', 'スイート'],
      ['karai', 'からい'],
      ['spicy', 'スパイシー'],
      ['shio', 'しお'],
      ['salt', 'ソルト'],
      ['satou', 'さとう'],
      ['sugar', 'シュガー'],
      ['shoyu', 'しょうゆ'],
      ['soy sauce', 'ソイソース'],
    ];

    pairs.forEach(([romaji, hiragana]) => {
      map.set(romaji.toLowerCase(), hiragana);
    });

    return map;
  }

  private convertHiraganaToKatakana(input: string): string {
    return input.split('').map(char =>
      this.hiraganaToKatakana.get(char) || char,
    ).join('');
  }

  private convertKatakanaToHiragana(input: string): string {
    return input.split('').map(char =>
      this.katakanaToHiragana.get(char) || char,
    ).join('');
  }

  private convertRomajiToHiragana(input: string): string {
    const lowerInput = input.toLowerCase();
    return this.romajiToHiragana.get(lowerInput) || input;
  }

  private convertToRomajiApprox(input: string): string {
    // Comprehensive mapping for Japanese food terms including kanji-to-kana conversions
    const conversionMap = new Map([
      // Hiragana to romaji
      ['とり', 'tori'],
      ['ぎゅう', 'gyuu'],
      ['さかな', 'sakana'],
      ['ぶた', 'buta'],
      ['やさい', 'yasai'],
      ['ごはん', 'gohan'],
      ['たまご', 'tamago'],
      ['にく', 'niku'],
      ['いも', 'imo'],
      ['りんご', 'ringo'],
      ['すし', 'sushi'],
      ['かれー', 'kare'],
      ['らーめん', 'ramen'],
      ['うどん', 'udon'],
      ['そば', 'soba'],
      ['とんかつ', 'tonkatsu'],
      ['やきとり', 'yakitori'],
      ['えび', 'ebi'],
      ['かに', 'kani'],
      ['たこ', 'tako'],
      ['いか', 'ika'],
      ['みそ', 'miso'],
      ['てんぷら', 'tempura'],
      ['さしみ', 'sashimi'],
      ['おにぎり', 'onigiri'],
      ['べんとう', 'bento'],
      ['どんぶり', 'donburi'],
      ['だいこん', 'daikon'],
      ['にんじん', 'ninjin'],
      ['たまねぎ', 'tamanegi'],
      ['きゅうり', 'kyuuri'],
      ['もやし', 'moyashi'],
      ['みかん', 'mikan'],
      ['いちご', 'ichigo'],
      ['ぶどう', 'budou'],
      ['もも', 'momo'],
      ['なし', 'nashi'],
      ['こめ', 'kome'],
      ['ちゃ', 'cha'],

      // Kanji to hiragana/romaji
      ['鶏', 'とり'],
      ['牛', 'ぎゅう'],
      ['魚', 'さかな'],
      ['豚', 'ぶた'],
      ['肉', 'にく'],
      ['米', 'こめ'],
      ['卵', 'たまご'],
      ['野菜', 'やさい'],
      ['果物', 'くだもの'],
      ['麺', 'めん'],
      ['麦', 'むぎ'],
      ['豆', 'まめ'],
      ['芋', 'いも'],
      ['茶', 'ちゃ'],
      ['酒', 'さけ'],
      ['塩', 'しお'],
      ['砂糖', 'さとう'],
      ['醤油', 'しょうゆ'],
      ['味噌', 'みそ'],
      ['酢', 'す'],
      ['油', 'あぶら'],
      ['水', 'みず'],
      ['湯', 'ゆ'],
      ['氷', 'こおり'],
      ['寿司', 'すし'],
      ['刺身', 'さしみ'],
      ['天麩羅', 'てんぷら'],
      ['天ぷら', 'てんぷら'],
      ['焼鳥', 'やきとり'],
      ['焼き鳥', 'やきとり'],
      ['豚カツ', 'とんかつ'],
      ['牛丼', 'ぎゅうどん'],
      ['親子丼', 'おやこどん'],
      ['鰻', 'うなぎ'],
      ['鯛', 'たい'],
      ['鮪', 'まぐろ'],
      ['鮭', 'さけ'],
      ['鯖', 'さば'],
      ['鰯', 'いわし'],
      ['海老', 'えび'],
      ['蟹', 'かに'],
      ['蛸', 'たこ'],
      ['烏賊', 'いか'],
      ['貝', 'かい'],
      ['蜆', 'しじみ'],
      ['牡蠣', 'かき'],
      ['帆立', 'ほたて'],
      ['雲丹', 'うに'],
      ['海苔', 'のり'],
      ['昆布', 'こんぶ'],
      ['若布', 'わかめ'],
      ['大根', 'だいこん'],
      ['人参', 'にんじん'],
      ['玉葱', 'たまねぎ'],
      ['胡瓜', 'きゅうり'],
      ['茄子', 'なす'],
      ['南瓜', 'かぼちゃ'],
      ['蓮根', 'れんこん'],
      ['牛蒡', 'ごぼう'],
      ['筍', 'たけのこ'],
      ['椎茸', 'しいたけ'],
      ['榎茸', 'えのきたけ'],
      ['舞茸', 'まいたけ'],
      ['林檎', 'りんご'],
      ['蜜柑', 'みかん'],
      ['苺', 'いちご'],
      ['葡萄', 'ぶどう'],
      ['桃', 'もも'],
      ['梨', 'なし'],
      ['柿', 'かき'],
      ['梅', 'うめ'],
      ['桜桃', 'さくらんぼ'],
      ['西瓜', 'すいか'],
      ['甜瓜', 'めろん'],
      ['鳳梨', 'ぱいなっぷる'],
      ['白米', 'はくまい'],
      ['玄米', 'げんまい'],
      ['餅', 'もち'],
      ['粥', 'かゆ'],
      ['御飯', 'ごはん'],
      ['飯', 'めし'],
      ['蕎麦', 'そば'],
      ['饂飩', 'うどん'],
      ['素麺', 'そうめん'],
      ['冷麦', 'ひやむぎ'],
      ['拉麺', 'らーめん'],
      ['焼蕎麦', 'やきそば'],
      ['菓子', 'かし'],
      ['饅頭', 'まんじゅう'],
      ['団子', 'だんご'],
      ['餡蜜', 'あんみつ'],
      ['善哉', 'ぜんざい'],
      ['雑煮', 'ぞうに'],

      // Katakana to romaji
      ['チキン', 'chicken'],
      ['ビーフ', 'beef'],
      ['ポーク', 'pork'],
      ['フィッシュ', 'fish'],
      ['ミート', 'meat'],
      ['ライス', 'rice'],
      ['パン', 'pan'],
      ['ブレッド', 'bread'],
      ['パスタ', 'pasta'],
      ['サラダ', 'salad'],
      ['スープ', 'soup'],
      ['ケーキ', 'cake'],
      ['チョコレート', 'chocolate'],
      ['アイスクリーム', 'ice cream'],
      ['コーヒー', 'coffee'],
      ['ジュース', 'juice'],
      ['ティー', 'tea'],
      ['ビール', 'beer'],
      ['ワイン', 'wine'],
      ['ウイスキー', 'whiskey'],
      ['ハンバーガー', 'hamburger'],
      ['サンドイッチ', 'sandwich'],
      ['ピザ', 'pizza'],
      ['カレー', 'curry'],
      ['シチュー', 'stew'],
      ['オムライス', 'omuraisu'],
      ['ナポリタン', 'napolitan'],
      ['ハンバーグ', 'hamburg'],
      ['コロッケ', 'korokke'],
      ['フライドチキン', 'fried chicken'],
      ['エビフライ', 'ebi fry'],
      ['トマト', 'tomato'],
      ['レタス', 'lettuce'],
      ['キャベツ', 'cabbage'],
      ['ピーマン', 'piiman'],
      ['ブロッコリー', 'broccoli'],
      ['カリフラワー', 'cauliflower'],
      ['アスパラガス', 'asparagus'],
      ['セロリ', 'celery'],
      ['パセリ', 'parsley'],
      ['バジル', 'basil'],
      ['オレンジ', 'orange'],
      ['レモン', 'lemon'],
      ['グレープフルーツ', 'grapefruit'],
      ['バナナ', 'banana'],
      ['パイナップル', 'pineapple'],
      ['キウイ', 'kiwi'],
      ['マンゴー', 'mango'],
      ['アボカド', 'avocado'],
      ['ココナッツ', 'coconut'],
      ['アーモンド', 'almond'],
      ['ピーナッツ', 'peanuts'],
      ['クルミ', 'kurumi'],
      ['チーズ', 'cheese'],
      ['バター', 'butter'],
      ['ヨーグルト', 'yogurt'],
      ['ミルク', 'milk'],
      ['クリーム', 'cream'],
      ['アイス', 'ice'],
      ['プリン', 'pudding'],
      ['ゼリー', 'jelly'],
      ['クッキー', 'cookie'],
      ['ビスケット', 'biscuit'],
      ['パイ', 'pie'],
      ['タルト', 'tart'],
      ['ドーナツ', 'donut'],
      ['マフィン', 'muffin'],
      ['パンケーキ', 'pancake'],
      ['ワッフル', 'waffle'],
      ['クレープ', 'crepe'],
      ['シュークリーム', 'choux cream'],
    ]);

    return conversionMap.get(input) || input;
  }

  // Add kanji-to-kana conversion method
  private convertKanjiToKana(input: string): string {
    // Use Kuromoji tokenizer for dynamic kanji→kana conversion
    // This provides comprehensive coverage for all Japanese text
    if (isTokenizerReady()) {
      const reading = getReading(input);
      // Kuromoji returns readings in katakana, convert to hiragana for consistency
      if (reading !== input) {
        return this.katakanaToHiraganaString(reading);
      }
    }

    // Fallback to static map for common food terms when tokenizer not ready
    const kanjiMap = new Map([
      // Basic food kanji to hiragana
      ['鶏', 'とり'],
      ['鳥', 'とり'],
      ['牛', 'ぎゅう'],
      ['豚', 'ぶた'],
      ['魚', 'さかな'],
      ['肉', 'にく'],
      ['卵', 'たまご'],
      ['玉子', 'たまご'],
      ['米', 'こめ'],
      ['飯', 'めし'],
      ['御飯', 'ごはん'],
      ['白米', 'はくまい'],
      ['野菜', 'やさい'],
      ['果物', 'くだもの'],
      ['麺', 'めん'],
      ['麦', 'むぎ'],
      ['豆', 'まめ'],
      ['芋', 'いも'],
      ['茶', 'ちゃ'],
      ['酒', 'さけ'],
      ['水', 'みず'],
      ['湯', 'ゆ'],
      ['氷', 'こおり'],
      ['塩', 'しお'],
      ['砂糖', 'さとう'],
      ['醤油', 'しょうゆ'],
      ['味噌', 'みそ'],
      ['酢', 'す'],
      ['油', 'あぶら'],
      ['胡麻', 'ごま'],
      ['寿司', 'すし'],
      ['刺身', 'さしみ'],
      ['天麩羅', 'てんぷら'],
      ['天ぷら', 'てんぷら'],
      ['焼鳥', 'やきとり'],
      ['焼き鳥', 'やきとり'],
      ['鯛', 'たい'],
      ['鮪', 'まぐろ'],
      ['鮭', 'さけ'],
      ['鯖', 'さば'],
      ['鰻', 'うなぎ'],
      ['鰯', 'いわし'],
      ['海老', 'えび'],
      ['蟹', 'かに'],
      ['蛸', 'たこ'],
      ['烏賊', 'いか'],
      ['貝', 'かい'],
      ['牡蠣', 'かき'],
      ['大根', 'だいこん'],
      ['人参', 'にんじん'],
      ['玉葱', 'たまねぎ'],
      ['胡瓜', 'きゅうり'],
      ['茄子', 'なす'],
      ['南瓜', 'かぼちゃ'],
      ['林檎', 'りんご'],
      ['蜜柑', 'みかん'],
      ['苺', 'いちご'],
      ['葡萄', 'ぶどう'],
      ['桃', 'もも'],
      ['梨', 'なし'],
      ['柿', 'かき'],
      ['蕎麦', 'そば'],
      ['饂飩', 'うどん'],
      ['素麺', 'そうめん'],
      ['餅', 'もち'],
      ['団子', 'だんご'],
      ['饅頭', 'まんじゅう'],
    ]);

    return kanjiMap.get(input) || input;
  }

  /**
   * Convert a full string from katakana to hiragana
   */
  private katakanaToHiraganaString(input: string): string {
    let result = '';
    for (const char of input) {
      result += this.katakanaToHiragana.get(char) || char;
    }
    return result;
  }

  /**
   * Split compound terms to improve partial matching
   */
  private splitCompoundTerms(input: string): string[] {
    const parts: string[] = [];

    // Handle common Japanese compound patterns
    const compoundPatterns = [
      // Cooking methods + food (e.g., やきとり -> やき + とり)
      { pattern: /^(やき|あげ|に|むし|いため)(.*)/, split: true },
      { pattern: /^(焼き|揚げ|煮|蒸し|炒め)(.*)/, split: true },
      { pattern: /^(グリル|フライ|ボイル)(.*)/, split: true },

      // Food + preparation (e.g., とりかつ -> とり + かつ)
      { pattern: /(.*)(かつ|てんぷら|フライ|カツ)$/, split: true },
      { pattern: /(.*)(カツ|テンプラ|天ぷら)$/, split: true },

      // Mixed dishes (e.g., チキンカレー -> チキン + カレー)
      { pattern: /(チキン|ビーフ|ポーク|フィッシュ)(.*)/, split: true },
      { pattern: /(.*)(カレー|ラーメン|うどん|そば)$/, split: true },
    ];

    for (const { pattern } of compoundPatterns) {
      const match = input.match(pattern);
      if (match && match.length > 2) {
        parts.push(match[1], match[2]);
        break;
      }
    }

    return parts.filter(part => part && part.length > 0);
  }

  /**
   * Generate fuzzy variants for better matching tolerance
   */
  private generateFuzzyVariants(input: string): string[] {
    const variants: string[] = [];

    // Long vowel normalization (ー normalization)
    const longVowelNormalized = input
      .replace(/ー/g, 'う') // Replace long vowel mark with う
      .replace(/uu/g, 'ー') // Replace double u with long vowel mark
      .replace(/aa/g, 'ー') // Replace double a with long vowel mark
      .replace(/ii/g, 'ー'); // Replace double i with long vowel mark

    if (longVowelNormalized !== input) {
      variants.push(longVowelNormalized);
    }

    // Small tsu (っ/ッ) variations for common patterns
    const smallTsuVariants = [
      input.replace(/っ/g, 'ッ'), // hiragana small tsu to katakana
      input.replace(/ッ/g, 'っ'), // katakana small tsu to hiragana
      input.replace(/っ/g, ''), // remove small tsu entirely
      input.replace(/ッ/g, ''), // remove small tsu entirely
    ];

    smallTsuVariants.forEach((variant) => {
      if (variant !== input && variant.length > 0) {
        variants.push(variant);
      }
    });

    // Particle variations (を/お, は/わ)
    const particleVariants = [
      input.replace(/を/g, 'お'),
      input.replace(/お/g, 'を'),
      input.replace(/は/g, 'わ'),
      input.replace(/わ/g, 'は'),
    ];

    particleVariants.forEach((variant) => {
      if (variant !== input) {
        variants.push(variant);
      }
    });

    return variants;
  }

  /**
   * Phase 2: Smart text preprocessing and normalization
   * Applies comprehensive Japanese text cleaning and standardization
   */
  private preprocessJapaneseText(input: string): string {
    // 1. Unicode normalization (NFKC - canonical decomposition + canonical composition)
    let processed = input.normalize('NFKC');

    // 2. Full-width to half-width character normalization for ASCII
    processed = processed.replace(/[\uFF01-\uFF5E]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    // 3. Half-width to full-width katakana conversion
    processed = processed.replace(/[\uFF66-\uFF9F]/g, (char) => {
      const halfToFullMap: { [key: string]: string } = {
        ｱ: 'ア',
        ｲ: 'イ',
        ｳ: 'ウ',
        ｴ: 'エ',
        ｵ: 'オ',
        ｶ: 'カ',
        ｷ: 'キ',
        ｸ: 'ク',
        ｹ: 'ケ',
        ｺ: 'コ',
        ｻ: 'サ',
        ｼ: 'シ',
        ｽ: 'ス',
        ｾ: 'セ',
        ｿ: 'ソ',
        ﾀ: 'タ',
        ﾁ: 'チ',
        ﾂ: 'ツ',
        ﾃ: 'テ',
        ﾄ: 'ト',
        ﾅ: 'ナ',
        ﾆ: 'ニ',
        ﾇ: 'ヌ',
        ﾈ: 'ネ',
        ﾉ: 'ノ',
        ﾊ: 'ハ',
        ﾋ: 'ヒ',
        ﾌ: 'フ',
        ﾍ: 'ヘ',
        ﾎ: 'ホ',
        ﾏ: 'マ',
        ﾐ: 'ミ',
        ﾑ: 'ム',
        ﾒ: 'メ',
        ﾓ: 'モ',
        ﾔ: 'ヤ',
        ﾕ: 'ユ',
        ﾖ: 'ヨ',
        ﾗ: 'ラ',
        ﾘ: 'リ',
        ﾙ: 'ル',
        ﾚ: 'レ',
        ﾛ: 'ロ',
        ﾜ: 'ワ',
        ﾝ: 'ン',
        ｦ: 'ヲ',
        ｧ: 'ァ',
        ｨ: 'ィ',
        ｩ: 'ゥ',
        ｪ: 'ェ',
        ｫ: 'ォ',
        ｬ: 'ャ',
        ｭ: 'ュ',
        ｮ: 'ョ',
        ｯ: 'ッ',
      };
      return halfToFullMap[char] || char;
    });

    // 4. Standardize long vowel marks and repetition
    processed = processed
      .replace(/~/g, 'ー') // Convert tilde to long vowel mark
      .replace(/〜/g, 'ー') // Convert wave dash to long vowel mark
      .replace(/ー+/g, 'ー'); // Normalize multiple long vowel marks

    // 5. Clean up spacing and punctuation
    processed = processed
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/[・･]/g, '') // Remove middle dots
      .replace(/[（）()]/g, '') // Remove parentheses
      .replace(/[「」]/g, '') // Remove quotation marks
      .replace(/[！!？?]/g, '') // Remove exclamation/question marks
      .trim();

    return processed;
  }

  /**
   * Phase 2: Extract base forms of Japanese words
   * Handles common inflections and conjugations
   */
  private extractBaseForms(input: string): string[] {
    const baseForms = new Set<string>();

    // Add original
    baseForms.add(input);

    // Handle common verb endings and convert to base forms
    const verbEndings = [
      { pattern: /します$/g, replacement: 'する' },
      { pattern: /しました$/g, replacement: 'する' },
      { pattern: /している$/g, replacement: 'する' },
      { pattern: /ています$/g, replacement: 'る' },
      { pattern: /ました$/g, replacement: 'る' },
      { pattern: /ます$/g, replacement: 'る' },
      { pattern: /だった$/g, replacement: 'だ' },
      { pattern: /でした$/g, replacement: 'だ' },
      { pattern: /です$/g, replacement: 'だ' },
    ];

    verbEndings.forEach(({ pattern, replacement }) => {
      if (pattern.test(input)) {
        const baseForm = input.replace(pattern, replacement);
        if (baseForm !== input && baseForm.length > 0) {
          baseForms.add(baseForm);
        }
      }
    });

    // Handle adjective endings
    const adjectiveEndings = [
      { pattern: /かった$/g, replacement: 'い' },
      { pattern: /くない$/g, replacement: 'い' },
      { pattern: /くなかった$/g, replacement: 'い' },
      { pattern: /そう$/g, replacement: 'い' },
    ];

    adjectiveEndings.forEach(({ pattern, replacement }) => {
      if (pattern.test(input)) {
        const baseForm = input.replace(pattern, replacement);
        if (baseForm !== input && baseForm.length > 0) {
          baseForms.add(baseForm);
        }
      }
    });

    // Handle noun plural/modifier patterns
    const nounPatterns = [
      { pattern: /たち$/g, replacement: '' }, // Plural marker
      { pattern: /ども$/g, replacement: '' }, // Humble plural
      { pattern: /ら$/g, replacement: '' }, // Informal plural
      { pattern: /の$/g, replacement: '' }, // Possessive particle
      { pattern: /が$/g, replacement: '' }, // Subject particle
      { pattern: /を$/g, replacement: '' }, // Object particle
      { pattern: /に$/g, replacement: '' }, // Location particle
      { pattern: /で$/g, replacement: '' }, // Location/method particle
      { pattern: /から$/g, replacement: '' }, // From particle
      { pattern: /まで$/g, replacement: '' }, // Until particle
    ];

    nounPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(input)) {
        const baseForm = input.replace(pattern, replacement);
        if (baseForm !== input && baseForm.length > 1) { // Keep at least 2 chars
          baseForms.add(baseForm);
        }
      }
    });

    return Array.from(baseForms);
  }

  /**
   * Phase 2: Generate reading-based variants for fuzzy matching
   * Converts to phonetic representations for cross-script similarity
   */
  private generateReadingVariants(input: string): string[] {
    const variants = new Set<string>();

    // 1. Generate hiragana and katakana variants
    const hiraganaVariant = this.convertKatakanaToHiragana(input);
    const katakanaVariant = this.convertHiraganaToKatakana(input);

    if (hiraganaVariant !== input)
      variants.add(hiraganaVariant);
    if (katakanaVariant !== input)
      variants.add(katakanaVariant);

    // 2. Generate romaji approximations for phonetic matching
    const romajiVariant = this.convertToRomajiApprox(input);
    if (romajiVariant !== input)
      variants.add(romajiVariant);

    // 3. Handle common phonetic variations
    const phoneticVariations = [
      // Long vowel variations
      { from: /ー/g, to: 'u' },
      { from: /う$/g, to: 'ー' },
      { from: /ou/g, to: 'ō' },
      { from: /oo/g, to: 'ō' },

      // Consonant cluster variations
      { from: /っ([kptcs])/g, to: '$1$1' }, // Small tsu + consonant
      { from: /([kptcs])\1/g, to: 'っ$1' }, // Double consonant to small tsu

      // Common misreadings
      { from: /shi/g, to: 'si' },
      { from: /chi/g, to: 'ti' },
      { from: /tsu/g, to: 'tu' },
      { from: /fu/g, to: 'hu' },
      { from: /ji/g, to: 'zi' },
      { from: /zu/g, to: 'du' },
    ];

    // Apply variations to all current variants
    const currentVariants = Array.from(variants);
    currentVariants.push(input);

    currentVariants.forEach((variant) => {
      phoneticVariations.forEach(({ from, to }) => {
        const modified = variant.replace(from, to);
        if (modified !== variant) {
          variants.add(modified);
        }
      });
    });

    // 4. Generate regional dialect approximations
    const dialectVariations = [
      // Kansai-ben approximations
      { from: /です/g, to: 'や' },
      { from: /ません/g, to: 'へん' },
      { from: /だ$/g, to: 'や' },

      // Hokkaido-ben approximations
      { from: /ている$/g, to: 'てる' },
      { from: /だべ$/g, to: 'だ' },

      // Common contractions
      { from: /ている/g, to: 'てる' },
      { from: /ては/g, to: 'ちゃ' },
      { from: /では/g, to: 'じゃ' },
    ];

    currentVariants.forEach((variant) => {
      dialectVariations.forEach(({ from, to }) => {
        const modified = variant.replace(from, to);
        if (modified !== variant) {
          variants.add(modified);
        }
      });
    });

    return Array.from(variants);
  }
}
