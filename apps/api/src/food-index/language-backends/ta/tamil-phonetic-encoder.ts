import type { PhoneticEncoder } from '@intake24/api/food-index/dictionary';

export default class TamilPhoneticEncoder implements PhoneticEncoder {
  // Tamil character to phonetic mapping
  private readonly vowelMap: Record<string, string> = {
    அ: 'a',
    ஆ: 'aa',
    இ: 'i',
    ஈ: 'ii',
    உ: 'u',
    ஊ: 'uu',
    எ: 'e',
    ஏ: 'ee',
    ஐ: 'ai',
    ஒ: 'o',
    ஓ: 'oo',
    ஔ: 'au',
  };

  private readonly consonantMap: Record<string, string> = {
    க: 'k',
    ங: 'ng',
    ச: 'ch',
    ஞ: 'ny',
    ட: 't',
    ண: 'n',
    த: 'th',
    ந: 'n',
    ப: 'p',
    ம: 'm',
    ய: 'y',
    ர: 'r',
    ல: 'l',
    வ: 'v',
    ழ: 'zh',
    ள: 'l',
    ற: 'r',
    ன: 'n',
    ஜ: 'j',
    ஷ: 'sh',
    ஸ: 's',
    ஹ: 'h',
    க்ஷ: 'ksh',
  };

  // Tamil vowel signs (dependent vowels)
  private readonly vowelSignMap: Record<string, string> = {
    'ா': 'aa',
    'ி': 'i',
    'ீ': 'ii',
    'ு': 'u',
    'ூ': 'uu',
    'ெ': 'e',
    'ே': 'ee',
    'ை': 'ai',
    'ொ': 'o',
    'ோ': 'oo',
    'ௌ': 'au',
    '்': '', // Pulli (virama) - consonant without vowel
  };

  encode(input: string): Array<string> {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const normalized = input.toLowerCase().trim();
    const phonetic = this.convertToPhonetic(normalized);

    // Return both the phonetic representation and a simplified version
    const simplified = this.simplifyPhonetic(phonetic);

    const results = [phonetic];
    if (simplified !== phonetic) {
      results.push(simplified);
    }

    return results;
  }

  private convertToPhonetic(text: string): string {
    let result = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      // Check for two-character combinations (like க்ஷ)
      if (i < text.length - 1) {
        const twoChar = text.slice(i, i + 2);
        if (this.consonantMap[twoChar]) {
          result += this.consonantMap[twoChar];
          i += 2;
          continue;
        }
      }

      // Check consonants
      if (this.consonantMap[char]) {
        result += this.consonantMap[char];
        i++;

        // Check for following vowel sign
        if (i < text.length && this.vowelSignMap[text[i]]) {
          if (text[i] !== '்') { // If not pulli
            result += this.vowelSignMap[text[i]];
          }
          i++;
        }
        else {
          // Consonant without explicit vowel sign has inherent 'a'
          result += 'a';
        }
        continue;
      }

      // Check vowels
      if (this.vowelMap[char]) {
        result += this.vowelMap[char];
        i++;
        continue;
      }

      // Check vowel signs (shouldn't appear alone, but handle gracefully)
      if (this.vowelSignMap[char]) {
        result += this.vowelSignMap[char];
        i++;
        continue;
      }

      // Keep other characters as-is (numbers, spaces, etc.)
      result += char;
      i++;
    }

    return result;
  }

  private simplifyPhonetic(phonetic: string): string {
    // Simplify the phonetic representation by:
    // 1. Removing duplicate consonants
    // 2. Simplifying long vowels to short
    // 3. Normalizing similar sounds

    let simplified = phonetic
      .replace(/aa/g, 'a')
      .replace(/ii/g, 'i')
      .replace(/uu/g, 'u')
      .replace(/ee/g, 'e')
      .replace(/oo/g, 'o')
      .replace(/([a-z])\1+/g, '$1'); // Remove duplicate consonants

    // Normalize similar sounds
    simplified = simplified
      .replace(/ch/g, 's')
      .replace(/sh/g, 's')
      .replace(/zh/g, 'l')
      .replace(/ny/g, 'n')
      .replace(/ng/g, 'n')
      .replace(/th/g, 't');

    return simplified;
  }
}
