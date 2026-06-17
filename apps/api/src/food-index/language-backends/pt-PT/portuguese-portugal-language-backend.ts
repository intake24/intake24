import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import natural from 'natural';

import PortuguesePhoneticEncoder from './phonetic';

const { PorterStemmerPt } = natural;
const sanitiseRegexp = /[.`,/\\\-+)(]|e\.g\.|e\.g/g;

export default {
  name: 'Portuguese (Portugal)',
  languageCode: 'pt-PT',
  indexIgnore: ['e', 'ou', 'em', 'o', 'a', 'os', 'as', 'com', 'sem', 'para', 'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'tipo'],

  phoneticEncoder: new PortuguesePhoneticEncoder(),

  splitCompound(word: string): Array<string> {
    return [word];
  },

  stem(word: string): string {
    if (word.length < 3)
      return word;
    return PorterStemmerPt.stem(word.toLocaleLowerCase());
  },

  sanitiseDescription(description: string): string {
    return description.replace(sanitiseRegexp, ' ');
  },
} satisfies LanguageBackend;
