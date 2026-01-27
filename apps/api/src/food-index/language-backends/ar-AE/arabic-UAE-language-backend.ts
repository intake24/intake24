import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import Stemmer from 'arabic-stem';

const indexFilter
  = [
    'و', // "And"
    'أو', // "Or"
    'ب', // "In" or "with"
    'بشكل', // "In the form of"
    'بين', // "Between"
    'ثم', // "Then"
    'إلا', // "Except"
    'من', // "From" or "of"
    'في', // "In"
    'مع', // "With"
    'كما', // "As" or "like"
    'لكن', // "But"
    'ل', // "For" or "to"
    'أي', // "Which"
    'إما', // "Either"
    'بعض', // "Some"
  ];

const stemmer = new Stemmer();

export default {
  name: 'Arabic (UAE)',
  languageCode: 'ar-AE',
  indexIgnore: [],
  phoneticEncoder: undefined,

  splitCompound(word: string): Array<string> {
    return [word];
  },

  stem(word: string): string {
    return stemmer.stem(word).normalized;
  },

  sanitiseDescription(description: string): string {
    return description.split('\s+').filter(word => !indexFilter.includes(word)).join(' ');
  },
} satisfies LanguageBackend;
