import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import TamilPhoneticEncoder from './tamil-phonetic-encoder';

const sanitiseRegexp = /[.`,/\\\-+)(]|'s/g;

export default {
  name: 'Tamil',
  languageCode: 'ta',
  indexIgnore: [
    'மற்றும்', // and
    'அல்லது', // or
    'இல்', // in
    'உடன்', // with
    'இருந்து', // from
    'க்கு', // to/for
    'ஆக', // as
    'போன்ற', // like
    'வகை', // type
    'சேர்த்து', // added
    'கொண்ட', // having
  ],

  phoneticEncoder: new TamilPhoneticEncoder(),

  splitCompound(word: string): Array<string> {
    return [word];
  },

  stem(word: string): string {
    if (word.length < 3)
      return word;

    // Common Tamil suffixes to remove
    const suffixes = [
      'கள்', // plural marker
      'ங்கள்', // plural marker (alternative)
      'உடன்', // with
      'இன்', // of/from
      'ஆல்', // by
      'க்கு', // to/for
      'இல்', // in/at
      'ஐ', // accusative
      'ஓடு', // with (instrumental)
      'உக்கு', // for
      'உடைய', // possessive
      'ஆக', // as
      'ஆன', // which is
      'ஆகிய', // which is (alternative)
    ];

    let stemmed = word.toLocaleLowerCase();

    // Try to remove suffixes
    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= 2) {
        stemmed = stemmed.slice(0, -suffix.length);
        break; // Remove only one suffix
      }
    }

    return stemmed;
  },

  sanitiseDescription(description: string): string {
    return description.replace(sanitiseRegexp, ' ');
  },
} satisfies LanguageBackend;
