import { getObjectNestedKeys, merge, mergeMultiple } from '@intake24/common/util';

describe('getObjectNestedKeys', () => {
  it('it should get deeply extract all keys with dotted syntax', () => {
    const obj = {
      a: 1,
      b: 2,
      c: {
        a: 1,
        b: 2,
        c: { a: 1, b: 2 },
      },
    };

    const keys = getObjectNestedKeys(obj);

    expect(keys).toEqual(['a', 'b', 'c.a', 'c.b', 'c.c.a', 'c.c.b']);
  });

  it('it should keep key of empty object', () => {
    const obj = {
      a: 1,
      b: 2,
      c: {
        a: 1,
        b: 2,
        c: {},
      },
    };

    const keys = getObjectNestedKeys(obj);

    expect(keys).toEqual(['a', 'b', 'c.a', 'c.b', 'c.c']);
  });
});

describe('merge multiple objects', () => {
  it('it should merge multiple objects', () => {
    const one = {
      a: 1,
      b: [1, 2, 3, 4, 5],
      c: 3,
    };
    const two = {
      a: 2,
      b: [6, 7, 8, 9, 10],
      d: 4,
    };
    const three = {
      a: 3,
      d: 5,
      e: 6,
    };

    const merged = mergeMultiple(one, two, three);

    expect(merged).toEqual({
      a: 3,
      b: [6, 7, 8, 9, 10],
      c: 3,
      d: 5,
      e: 6,
    });
  });
});

describe('merge', () => {
  /*
   * Only testing the behavior of array merge
   * -> source array should be copied
   */
  it('it should merge with copied source array', () => {
    const one = {
      a: 1,
      b: [1, 2, 3, 4, 5],
      c: 3,
    };
    const two = {
      a: 2,
      b: [6, 7, 8, 9, 10],
      d: 4,
    };

    const merged = merge(one, two);

    expect(merged).toEqual({
      a: 2,
      b: [6, 7, 8, 9, 10],
      c: 3,
      d: 4,
    });
  });
});
