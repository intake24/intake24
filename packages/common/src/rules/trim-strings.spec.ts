import { MaxDepthExceededError, trimStrings } from '@intake24/common/rules';

function nest(depth: number): unknown {
  let value: unknown = 'leaf';
  for (let i = 0; i < depth; i++) {
    value = i % 2
      ? { a: value }
      : [value];
  }
  return value;
}

describe('input trim string middleware', () => {
  it('should trim string and replace empty with nulls', () => {
    expect(trimStrings(' to be trimmed ')).toEqual('to be trimmed');
  });

  it('should trim white spaces string to null', () => {
    expect(trimStrings('  ')).toEqual(null);
  });

  it('should trim empty string to null', () => {
    expect(trimStrings('')).toEqual(null);
  });

  it('should leave other types unchanged', () => {
    expect(trimStrings(undefined)).toEqual(undefined);
    expect(trimStrings(true)).toEqual(true);
  });

  it('should process input up to the default max depth', () => {
    expect(() => trimStrings(nest(64))).not.toThrow();
  });

  it('should throw when input exceeds the default max depth', () => {
    expect(() => trimStrings(nest(65))).toThrow(MaxDepthExceededError);
  });

  it('should respect custom max depth', () => {
    expect(() => trimStrings(nest(2), { maxDepth: 2 })).not.toThrow();
    expect(() => trimStrings(nest(3), { maxDepth: 2 })).toThrow(MaxDepthExceededError);
  });

  it('should not count scalars towards depth', () => {
    expect(() => trimStrings('  x  ', { maxDepth: 0 })).not.toThrow();
  });
});
