import kuromoji from 'kuromoji';
import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import JapanesePhoneticEncoder from './japanese-phonetic-encoder';

const sanitiseRegexp = /[。、・.,`/\\\-+)(（）「」『』【】〈〉《》〔〕［］｛｝等]|など/g;

// Global tokenizer instance to avoid reloading dictionary
let tokenizerInstance: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;
let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
        if (err) {
          reject(err);
        }
        else {
          tokenizerInstance = tokenizer;
          resolve(tokenizer);
        }
      });
    });
  }

  return tokenizerPromise;
}

/**
 * Extract reading (katakana pronunciation) from Japanese text using Kuromoji.
 * This function uses the tokenizer's built-in dictionary to get accurate readings
 * for kanji, eliminating the need for static lookup tables.
 *
 * @param text - Japanese text (may contain kanji, hiragana, katakana, or mixed)
 * @returns The reading in katakana, or the original text if no reading available
 */
export function getReading(text: string): string {
  if (!tokenizerInstance) {
    return text;
  }

  try {
    const tokens = tokenizerInstance.tokenize(text);
    if (tokens.length === 0) {
      return text;
    }

    // Concatenate readings from all tokens
    const readings = tokens.map((token) => {
      // Use reading if available, otherwise fall back to surface form
      // Kuromoji returns readings in katakana
      if (token.reading && token.reading !== '*') {
        return token.reading;
      }
      return token.surface_form;
    });

    return readings.join('');
  }
  catch {
    return text;
  }
}

/**
 * Check if the tokenizer is ready for use.
 * This is useful for components that need to know if reading extraction is available.
 */
export function isTokenizerReady(): boolean {
  return tokenizerInstance !== null;
}

function segmentJapaneseText(text: string): string[] {
  try {
    if (!tokenizerInstance) {
      // Fallback to basic segmentation if tokenizer not loaded
      return text.split(/\s+/).filter(word => word.length > 0);
    }

    const tokens = tokenizerInstance.tokenize(text);
    return tokens
      .filter((token) => {
        // Filter out particles, auxiliary words, and symbols
        const pos = token.pos;
        return pos !== '助詞' && pos !== '助動詞' && pos !== '記号' && token.surface_form.length > 0;
      })
      .map((token) => {
        // Handle Kuromoji's '*' placeholder for missing basic forms
        const basicForm = token.basic_form;
        return (basicForm && basicForm !== '*') ? basicForm : token.surface_form;
      });
  }
  catch {
    // Fallback to basic splitting if tokenization fails
    return text.split(/\s+/).filter(word => word.length > 0);
  }
}

export default {
  name: 'Japanese',
  languageCode: 'ja',
  indexIgnore: ['と', 'の', 'に', 'を', 'は', 'が', 'で', 'や', 'も', 'から', 'まで', 'より', 'ため', 'など', 'という', 'として', 'について'],
  phoneticEncoder: new JapanesePhoneticEncoder(),

  splitCompound(word: string): Array<string> {
    // For Japanese, we rely on morphological analysis for compound splitting
    // This is handled in the tokenization process
    return [word];
  },

  stem(word: string): string {
    try {
      if (!tokenizerInstance) {
        return word;
      }

      const tokens = tokenizerInstance.tokenize(word);
      if (tokens.length > 0) {
        // Return the basic form (dictionary form) of the first token
        // Handle Kuromoji's '*' placeholder for missing basic forms
        const basicForm = tokens[0].basic_form;
        return (basicForm && basicForm !== '*') ? basicForm : tokens[0].surface_form;
      }
      return word;
    }
    catch {
      return word;
    }
  },

  sanitiseDescription(description: string): string {
    let sanitised = description.replace(sanitiseRegexp, ' ');

    // For Japanese text, we need to segment words since they often don't use spaces
    if (tokenizerInstance) {
      const segments = segmentJapaneseText(sanitised);
      sanitised = segments.join(' ');
    }

    return sanitised;
  },
} satisfies LanguageBackend;

// Initialize tokenizer on module load
getTokenizer().catch((error) => {
  console.error('Failed to initialize Japanese tokenizer:', error);
});
