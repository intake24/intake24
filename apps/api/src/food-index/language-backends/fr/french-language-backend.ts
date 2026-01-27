import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import porter from 'talisman/stemmers/french/porter.js';

import FrenchPhoneticEncoder from './phonetic';

const sanitiseRegexp = /[.`,/\\\-+)(]|e\.g\.|e\.g|n\.s\.|à partir de|à base de's/g;

export default {
  name: 'French',
  languageCode: 'fr',
  indexIgnore: ['et', 'ou', 'en', 'l\'', 'le', 'la', 'les', 'avec', 'pour', 'd\'', 'de', 'des', 'à', 'au', 'aux', 'dans', 'type'],

  phoneticEncoder: new FrenchPhoneticEncoder(),

  splitCompound(word: string): Array<string> {
    return [word];
  },

  stem(word: string): string {
    return porter(word);
  },

  sanitiseDescription(description: string): string {
    return description.replace(sanitiseRegexp, ' ');
  },
} satisfies LanguageBackend;
