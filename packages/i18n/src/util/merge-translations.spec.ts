import { mergeTranslations } from '../../src';

describe('merge translation files', () => {
  it('should merge the translation with matching keys', () => {
    const target = {
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1' },
    };
    const source = {
      a: 'a11',
      b: 'b11',
      c: { ca: 'ca11' },
    };

    const merged = mergeTranslations(target, source);

    expect(merged).toEqual(source);
  });

  it('should discard non-existent keys from sources ( -> outdated translations)', () => {
    const target = {
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1' },
    };
    const source = {
      a: 'a11',
      b: 'b11',
      c: { ca: 'ca11', cb: 'cb2' },
      d: 'd1',
    };

    const merged = mergeTranslations(target, source);

    expect(merged).toEqual({
      a: 'a11',
      b: 'b11',
      c: { ca: 'ca11' },
    });
  });

  it('should keep newly created objects in default translation (-> code / default translation files update)', () => {
    const target = {
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1' },
    };
    const source = { a: 'a11', b: 'b11', c: 'c11' };

    const merged = mergeTranslations(target, source);

    expect(merged).toEqual({
      a: 'a11',
      b: 'b11',
      c: { ca: 'ca1' },
    });
  });

  it('should keep the arrays as-is', () => {
    const target = {
      a: 'a1',
      b: 'b1',
      c: [
        { ca: 'ca1' },
      ],
    };
    const source = {
      a: 'a11',
      b: 'b11',
      c: [
        { ca: 'ca11' },
        { cb: 'cb2' },
      ],
    };

    const merged = mergeTranslations(target, source);

    expect(merged).toEqual({
      a: 'a11',
      b: 'b11',
      c: [
        { ca: 'ca11' },
        { cb: 'cb2' },
      ],
    });
  });
});
