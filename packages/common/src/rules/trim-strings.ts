export function trimStrings<T = string>(input: T): T {
  if (typeof input === 'string') {
    const chars = input.trim();
    return (chars.length ? chars : null) as T;
  }

  if (Array.isArray(input))
    return input.map(item => trimStrings(item)) as T;

  if (Object.prototype.toString.call(input) === '[object Object]') {
    return Object.entries(input as Record<string, unknown>).reduce<any>((acc, [key, value]) => {
      acc[key] = trimStrings(value);
      return acc;
    }, {});
  }

  return input;
}
