import type { PhoneticEncoder } from '@intake24/api/food-index/dictionary';

import { metaphone } from '@oloko64/metaphone-ptbr-node';

export default class PortuguesePhoneticEncoder implements PhoneticEncoder {
  encode(input: string): Array<string> {
    // The library is Brazilian Portuguese Metaphone, which is a close
    // enough approximation for European Portuguese search indexing.
    // `metaphone` returns null for empty/invalid input; the empty `additionalPhases`
    // disables the default Brazilian company-suffix stripping (e.g. SA, LTDA),
    // which is irrelevant for food descriptions.
    const encoded = metaphone(input, []);
    return encoded ? [encoded] : [];
  }
}
