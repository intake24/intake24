import { DEFAULT_MAX_DEPTH, MaxDepthExceededError } from './max-depth';

export type TrimStringsOptions = {
  maxDepth?: number;
};

function trim(input: unknown, depth: number, maxDepth: number): unknown {
  if (typeof input === 'string') {
    const chars = input.trim();
    return chars.length ? chars : null;
  }

  const isArray = Array.isArray(input);
  const isObject = !isArray && Object.prototype.toString.call(input) === '[object Object]';
  if (!isArray && !isObject)
    return input;

  if (depth >= maxDepth)
    throw new MaxDepthExceededError(maxDepth);

  if (isArray)
    return input.map(item => trim(item, depth + 1, maxDepth));

  return Object.entries(input as Record<string, unknown>).reduce<any>((acc, [key, value]) => {
    acc[key] = trim(value, depth + 1, maxDepth);
    return acc;
  }, {});
}

export function trimStrings<T = string>(input: T, options: TrimStringsOptions = {}): T {
  return trim(input, 0, options.maxDepth ?? DEFAULT_MAX_DEPTH) as T;
}
