import { compareMessageKeys } from '../../src';

describe('compare message keys', () => {
  it('should fail for different keys', () => {
    const x = {
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1' },
    };
    const y = {
      a: 'a11',
      b: 'b11',
      c: { cb: 'ca11' },
    };

    const result = compareMessageKeys(x, y);

    expect(result).toBe(false);
  });

  it('should fail for different size', () => {
    const x = {
      a: 'a1',
      b: 'b1',
      c: { ca: 'ca1' },
    };
    const y = {
      a: 'a11',
      b: 'b11',
      c: { ca: 'ca11' },
      d: 'd1',
    };

    const result = compareMessageKeys(x, y);

    expect(result).toBe(false);
  });

  it('should succeed for same deep keys', () => {
    const x = {
      a: 'a1',
      b: 'b1',
      c: {
        ca: 'ca1',
        cb: { cc: 'cc1' },
      },
    };
    const y = {
      c: {
        ca: 'ca11',
        cb: { cc: 'cc11' },
      },
      b: 'b11',
      a: 'a11',
    };

    const result = compareMessageKeys(x, y);

    expect(result).toBe(true);
  });
});
