import kuromoji from 'kuromoji';

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

let tokenizerInstance: Tokenizer | null = null;
let tokenizerPromise: Promise<Tokenizer> | null = null;

const asciiFullWidthRegex = /[\uFF01-\uFF5E]/g;
const halfWidthKanaRegex = /[\uFF66-\uFF9F]/g;

const halfWidthKanaMap: Record<string, string> = {
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
  ﾞ: '゛',
  ﾟ: '゜',
};

const dakutenHiraganaMap: Record<string, string> = {
  か: 'が',
  き: 'ぎ',
  く: 'ぐ',
  け: 'げ',
  こ: 'ご',
  さ: 'ざ',
  し: 'じ',
  す: 'ず',
  せ: 'ぜ',
  そ: 'ぞ',
  た: 'だ',
  ち: 'ぢ',
  つ: 'づ',
  て: 'で',
  と: 'ど',
  は: 'ば',
  ひ: 'び',
  ふ: 'ぶ',
  へ: 'べ',
  ほ: 'ぼ',
  う: 'ゔ',
  ゝ: 'ゞ',
};

const handakutenHiraganaMap: Record<string, string> = {
  は: 'ぱ',
  ひ: 'ぴ',
  ふ: 'ぷ',
  へ: 'ぺ',
  ほ: 'ぽ',
};

const dakutenKatakanaMap: Record<string, string> = {
  カ: 'ガ',
  キ: 'ギ',
  ク: 'グ',
  ケ: 'ゲ',
  コ: 'ゴ',
  サ: 'ザ',
  シ: 'ジ',
  ス: 'ズ',
  セ: 'ゼ',
  ソ: 'ゾ',
  タ: 'ダ',
  チ: 'ヂ',
  ツ: 'ヅ',
  テ: 'デ',
  ト: 'ド',
  ハ: 'バ',
  ヒ: 'ビ',
  フ: 'ブ',
  ヘ: 'ベ',
  ホ: 'ボ',
  ウ: 'ヴ',
  ヽ: 'ヾ',
};

const handakutenKatakanaMap: Record<string, string> = {
  ハ: 'パ',
  ヒ: 'ピ',
  フ: 'プ',
  ヘ: 'ペ',
  ホ: 'ポ',
};

const hiraganaRangeRegex = /[\u3041-\u3096]/g;
const katakanaRangeRegex = /[\u30A1-\u30F6]/g;

const dakutenCleanupRegex = /[\u3099\u309A\u309B\u309C]/g;

const hiraganaDakutenRegex = /([\u3041-\u3096\u309D\u309E])\s*[\u3099\u309B]/g;
const hiraganaHandakutenRegex = /([\u3041-\u3096\u309D\u309E])\s*[\u309A\u309C]/g;
const katakanaDakutenRegex = /([\u30A1-\u30FA\u30FD\u30FE])\s*[\u3099\u309B]/g;
const katakanaHandakutenRegex = /([\u30A1-\u30FA\u30FD\u30FE])\s*[\u309A\u309C]/g;

const hiraganaToKatakanaOffset = 0x60;

async function getTokenizer(): Promise<Tokenizer> {
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
        if (err) {
          reject(err);
          return;
        }

        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      });
    });
  }

  return tokenizerPromise;
}

function convertAsciiFullWidthToHalfWidth(text: string): string {
  return text.replace(asciiFullWidthRegex, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });
}

function convertHalfWidthKanaToFullWidth(text: string): string {
  return text.replace(halfWidthKanaRegex, (char) => {
    return halfWidthKanaMap[char] || char;
  });
}

function applySoundMarks(text: string): string {
  let result = text
    .replace(hiraganaDakutenRegex, (_, base: string) => dakutenHiraganaMap[base] || base)
    .replace(hiraganaHandakutenRegex, (_, base: string) => handakutenHiraganaMap[base] || `${base}ー`)
    .replace(katakanaDakutenRegex, (_, base: string) => dakutenKatakanaMap[base] || base)
    .replace(katakanaHandakutenRegex, (_, base: string) => handakutenKatakanaMap[base] || `${base}ー`);

  // Remove lingering dakuten characters if they could not be mapped
  result = result
    .replace(dakutenCleanupRegex, '')
    .replace(/ー{2,}/g, 'ー');

  return result;
}

function convertKatakanaToHiragana(text: string): string {
  return text.replace(katakanaRangeRegex, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - hiraganaToKatakanaOffset);
  });
}

function convertHiraganaToKatakana(text: string): string {
  return text.replace(hiraganaRangeRegex, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + hiraganaToKatakanaOffset);
  });
}

export function normalizeJapaneseText(text: string): string {
  if (!text)
    return '';

  let normalized = text.normalize('NFKC');

  // Fix for half-width circle mark (゜ U+309C) used as lengthening mark substitute
  // Users sometimes type ゜ when they mean ー (katakana lengthening mark)
  // Example: "ち゜ず" should match "チーズ" (cheese)
  normalized = normalized.replace(/゜/g, 'ー');

  normalized = convertAsciiFullWidthToHalfWidth(normalized);
  normalized = convertHalfWidthKanaToFullWidth(normalized);
  normalized = applySoundMarks(normalized);

  return normalized.trim();
}

export function toHiragana(text: string): string {
  if (!text)
    return '';

  const normalized = normalizeJapaneseText(text);
  return convertKatakanaToHiragana(normalized);
}

export function toKatakana(text: string): string {
  if (!text)
    return '';

  const normalized = normalizeJapaneseText(text);
  return convertHiraganaToKatakana(normalized);
}

const romajiDigraphMap: Record<string, string> = {
  キャ: 'kya',
  キュ: 'kyu',
  キョ: 'kyo',
  キェ: 'kye',
  シャ: 'sha',
  シュ: 'shu',
  ショ: 'sho',
  シェ: 'she',
  チャ: 'cha',
  チュ: 'chu',
  チョ: 'cho',
  チェ: 'che',
  ニャ: 'nya',
  ニュ: 'nyu',
  ニョ: 'nyo',
  ニェ: 'nye',
  ヒャ: 'hya',
  ヒュ: 'hyu',
  ヒョ: 'hyo',
  ヒェ: 'hye',
  ミャ: 'mya',
  ミュ: 'myu',
  ミョ: 'myo',
  ミェ: 'mye',
  リャ: 'rya',
  リュ: 'ryu',
  リョ: 'ryo',
  リェ: 'rye',
  ギャ: 'gya',
  ギュ: 'gyu',
  ギョ: 'gyo',
  ギェ: 'gye',
  ジャ: 'ja',
  ジュ: 'ju',
  ジョ: 'jo',
  ジェ: 'je',
  ビャ: 'bya',
  ビュ: 'byu',
  ビョ: 'byo',
  ビェ: 'bye',
  ピャ: 'pya',
  ピュ: 'pyu',
  ピョ: 'pyo',
  ピェ: 'pye',
  デュ: 'dyu',
  ティ: 'ti',
  ディ: 'di',
  ファ: 'fa',
  フィ: 'fi',
  フェ: 'fe',
  フォ: 'fo',
  フュ: 'fyu',
  ヴァ: 'va',
  ヴィ: 'vi',
  ヴェ: 've',
  ヴォ: 'vo',
  ヴュ: 'vyu',
  ウァ: 'wa',
  ウィ: 'wi',
  ウェ: 'we',
  ウォ: 'wo',
  クァ: 'kwa',
  クィ: 'kwi',
  クェ: 'kwe',
  クォ: 'kwo',
  グァ: 'gwa',
  グィ: 'gwi',
  グェ: 'gwe',
  グォ: 'gwo',
  ツァ: 'tsa',
  ツィ: 'tsi',
  ツェ: 'tse',
  ツォ: 'tso',
  シィ: 'si',
  ジィ: 'ji',
  チィ: 'chi',
  ヂィ: 'ji',
};

const romajiMonographMap: Record<string, string> = {
  ア: 'a',
  イ: 'i',
  ウ: 'u',
  エ: 'e',
  オ: 'o',
  カ: 'ka',
  キ: 'ki',
  ク: 'ku',
  ケ: 'ke',
  コ: 'ko',
  サ: 'sa',
  シ: 'shi',
  ス: 'su',
  セ: 'se',
  ソ: 'so',
  タ: 'ta',
  チ: 'chi',
  ツ: 'tsu',
  テ: 'te',
  ト: 'to',
  ナ: 'na',
  ニ: 'ni',
  ヌ: 'nu',
  ネ: 'ne',
  ノ: 'no',
  ハ: 'ha',
  ヒ: 'hi',
  フ: 'fu',
  ヘ: 'he',
  ホ: 'ho',
  マ: 'ma',
  ミ: 'mi',
  ム: 'mu',
  メ: 'me',
  モ: 'mo',
  ヤ: 'ya',
  ユ: 'yu',
  ヨ: 'yo',
  ラ: 'ra',
  リ: 'ri',
  ル: 'ru',
  レ: 're',
  ロ: 'ro',
  ワ: 'wa',
  ヰ: 'wi',
  ヱ: 'we',
  ヲ: 'o',
  ン: 'n',
  ガ: 'ga',
  ギ: 'gi',
  グ: 'gu',
  ゲ: 'ge',
  ゴ: 'go',
  ザ: 'za',
  ジ: 'ji',
  ズ: 'zu',
  ゼ: 'ze',
  ゾ: 'zo',
  ダ: 'da',
  ヂ: 'ji',
  ヅ: 'zu',
  デ: 'de',
  ド: 'do',
  バ: 'ba',
  ビ: 'bi',
  ブ: 'bu',
  ベ: 'be',
  ボ: 'bo',
  パ: 'pa',
  ピ: 'pi',
  プ: 'pu',
  ペ: 'pe',
  ポ: 'po',
  ヴ: 'vu',
  シェ: 'she',
  ジェ: 'je',
  チェ: 'che',
  ツィ: 'tsi',
  ディ: 'di',
  ァ: 'a',
  ィ: 'i',
  ゥ: 'u',
  ェ: 'e',
  ォ: 'o',
  ャ: 'ya',
  ュ: 'yu',
  ョ: 'yo',
  ヮ: 'wa',
};

export function toRomaji(text: string): string {
  if (!text)
    return '';

  const katakana = toKatakana(text);
  let result = '';

  for (let i = 0; i < katakana.length;) {
    const current = katakana[i];

    if (current === 'ー') {
      if (result.length > 0) {
        const last = result[result.length - 1];
        result += last === 'o' ? 'u' : last;
      }
      i += 1;
      continue;
    }

    if (current === 'ッ') {
      const nextTwo = katakana.slice(i + 1, i + 3);
      const nextChar = katakana[i + 1] ?? '';
      let consonantSource = '';

      if (romajiDigraphMap[nextTwo])
        consonantSource = romajiDigraphMap[nextTwo];
      else if (romajiMonographMap[nextChar])
        consonantSource = romajiMonographMap[nextChar];

      if (consonantSource)
        result += consonantSource[0];
      i += 1;
      continue;
    }

    const twoChar = katakana.slice(i, i + 2);
    if (romajiDigraphMap[twoChar]) {
      result += romajiDigraphMap[twoChar];
      i += 2;
      continue;
    }

    if (romajiMonographMap[current]) {
      let romaji = romajiMonographMap[current];

      if (current === 'ン') {
        const nextChar = katakana[i + 1] ?? '';
        if (nextChar && ['バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ', 'マ', 'ミ', 'ム', 'メ', 'モ'].includes(nextChar))
          romaji = 'm';
      }

      result += romaji;
      i += 1;
      continue;
    }

    result += current;
    i += 1;
  }

  return result;
}

export async function getHiraganaReading(text: string): Promise<string> {
  if (!text)
    return '';

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);

    const reading = tokens.map((token) => {
      if (token.reading && token.reading !== '*')
        return token.reading;

      return token.surface_form || '';
    }).join('');

    return toHiragana(reading || text);
  }
  catch {
    // Fallback: try simple conversion
    return toHiragana(text);
  }
}

export async function generateJapaneseOrthographicVariants(text: string, limit = 64): Promise<string[]> {
  if (!text)
    return [];

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);

    const variantOptions = tokens.map((token) => {
      const surface = token.surface_form || '';
      const options = new Set<string>();

      const normalizedSurface = normalizeJapaneseText(surface);
      if (surface)
        options.add(surface);
      if (normalizedSurface)
        options.add(normalizedSurface);

      const baseForm = token.basic_form && token.basic_form !== '*' ? token.basic_form : surface;
      if (baseForm)
        options.add(normalizeJapaneseText(baseForm));

      const readingKatakana = token.reading && token.reading !== '*' ? token.reading : surface;
      const readingHiragana = toHiragana(readingKatakana);
      if (readingHiragana)
        options.add(readingHiragana);
      const readingKatakanaNormalized = toKatakana(readingHiragana);
      if (readingKatakanaNormalized)
        options.add(readingKatakanaNormalized);

      return Array.from(options).filter(Boolean);
    }).filter(options => options.length > 0);

    if (variantOptions.length === 0)
      return [normalizeJapaneseText(text)];

    const variants = new Set<string>();

    const buildVariant = (index: number, parts: string[]) => {
      if (variants.size >= limit)
        return;

      if (index >= variantOptions.length) {
        const candidate = normalizeJapaneseText(parts.join(''));
        if (candidate)
          variants.add(candidate);
        return;
      }

      for (const option of variantOptions[index]) {
        parts.push(option);
        buildVariant(index + 1, parts);
        parts.pop();

        if (variants.size >= limit)
          break;
      }
    };

    buildVariant(0, []);

    variants.add(normalizeJapaneseText(text));
    variants.add(text);

    return Array.from(variants);
  }
  catch {
    return [normalizeJapaneseText(text)];
  }
}

export function normalizeForSearch(text: string): {
  original: string;
  normalized: string;
  hiragana: string;
  katakana: string;
} {
  const normalized = normalizeJapaneseText(text);
  const hiragana = toHiragana(normalized);
  const katakana = toKatakana(normalized);

  return {
    original: text,
    normalized,
    hiragana,
    katakana,
  };
}
