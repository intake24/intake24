import z from 'zod';

import { emptyStringsToUndefined, validateConfig } from './config';

describe('validateConfig', () => {
  it('converts empty strings in nested objects to undefined, keeps array items', () => {
    expect(emptyStringsToUndefined({
      a: '',
      b: { c: '', d: 'x' },
      e: ['', 'y'],
      f: 0,
      g: false,
    }))
      .toEqual({
        a: undefined,
        b: { c: undefined, d: 'x' },
        e: ['', 'y'],
        f: 0,
        g: false,
      });
  });

  it('applies schema defaults for empty env values', () => {
    const schema = z.object({
      enabled: z.boolean().or(z.stringbool()).default(false),
      port: z.coerce.number().int().positive().default(6379),
    });

    expect(validateConfig('Test', schema, { enabled: '', port: '' })).toEqual({ enabled: false, port: 6379 });
  });
});
