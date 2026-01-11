import natural from 'natural';
import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import Metaphone3Encoder from './metaphone-encoder';

const { PorterStemmer } = natural;
const sanitiseRegexp = /[.`,/\\\-+)(]|e\.g\.|e\.g|'s/g;

export default {
  name: 'English',
  languageCode: 'en',
  indexIgnore: ['and', 'the', 'with', 'from'],
  phoneticEncoder: new Metaphone3Encoder(),

  splitCompound(word: string): Array<string> {
    return [word];
  },

  stem(word: string): string {
    if (word.length < 3)
      return word;
    return PorterStemmer.step5b(
      PorterStemmer.step5a(
        // PorterStemmer.step4( // V4-1488: step4 in the Porter algorithm is too aggressive for our use case (for example vegetable -> veget)
        PorterStemmer.step3(
          PorterStemmer.step2(
            PorterStemmer.step1c(
              PorterStemmer.step1b(
                PorterStemmer.step1a(
                  word.toLocaleLowerCase(),
                ),
              ),
            ),
          ),
          // ),
        ),
      ),
    )
      .toString();
  },

  sanitiseDescription(description: string): string {
    return description.replace(sanitiseRegexp, ' ');
  },
} satisfies LanguageBackend;
