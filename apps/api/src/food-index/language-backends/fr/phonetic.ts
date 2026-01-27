import type { PhoneticEncoder } from '@intake24/api/food-index/dictionary';

import phonetic from 'talisman/phonetics/french/phonetic.js';

export default class FrenchPhoneticEncoder implements PhoneticEncoder {
  encode(input: string): Array<string> {
    return [phonetic(input)];
  }
}
