import deepmerge from 'deepmerge';
import copy from 'fast-copy';

export { default as copy } from 'fast-copy';

export function merge<T1, T2 = T1>(x: Partial<T1>, y: Partial<T2>): T1 & T2 {
  return deepmerge<T1, T2>(x, y, {
    arrayMerge: (destinationArray, sourceArray) => copy(sourceArray),
  });
}

export function mergeMultiple<T>(...args: any[]): T {
  const first = args.shift();
  if (!first)
    throw new Error('Missing arguments');

  return args.reduce<T>((acc, item) => merge<T>(acc, item), first);
}

export function getObjectNestedKeys<T extends object>(object: T, prefix?: string) {
  return Object.entries(object).reduce<string[]>((acc, [key, value]) => {
    let items: string[];
    if (Object.prototype.toString.call(value) === '[object Object]') {
      const nestedKeys = getObjectNestedKeys(value as object, key);
      // If object is empty, include the key itself so it can still be picked from source
      items = nestedKeys.length > 0 ? nestedKeys : [key];
    }
    else {
      items = [key];
    }

    if (prefix)
      items = items.map(item => `${prefix}.${item}`);
    acc.push(...items);
    return acc;
  }, []);
}

export function mapKeys<T>(
  obj: { [k: string]: T },
  fn: (value: string) => string,
): { [k: string]: T } {
  const entries = Object.entries(obj);
  return Object.fromEntries(entries.map(entry => [fn(entry[0]), entry[1]]));
}
