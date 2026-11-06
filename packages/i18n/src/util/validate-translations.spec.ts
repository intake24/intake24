import { validateTranslations } from '../../src';

describe('validate translations', () => {
  it('should fail for object of non-strings', () => {
    const result = validateTranslations({
      a: 'a1',
      b: 'b1',
      c: { ca: 2 },
    });

    expect(result).toBe(false);
  });

  it('should fail for object of non-strings, function', () => {
    const result = validateTranslations({
      a: () => 'b',
    });

    expect(result).toBe(false);
  });

  it('should pass for string', () => {
    const result = validateTranslations('a');

    expect(result).toBe(true);
  });

  it('should pass for object of string', () => {
    const result = validateTranslations({
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1', cb: '', cc: null },
    });

    expect(result).toBe(true);
  });
});
