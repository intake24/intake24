import type { Cache } from '@intake24/api/services';

import { initCache, releaseCache } from '@intake24/api-tests/unit/helpers/cache';

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const data: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

function getData(keys: string[], expectedKeys: string[]): Promise<Record<string, number | null>> {
  expect(keys).toEqual(expectedKeys);

  const result = Object.fromEntries(keys.map(k => [k, data[k] ?? null]));
  return Promise.resolve(result);
}

describe('cache', () => {
  let cache: Cache;

  beforeAll(() => {
    cache = initCache();
  });

  afterEach(async () => {
    await cache.flushdb();
  });

  afterAll(() => {
    releaseCache(cache);
  });

  it('set and get multiple items without an expiration time', async () => {
    const data = { 'food-attributes:a': 1, 'food-attributes:b': 2, 'food-attributes:c': 3 };

    await cache.mset(data);
    const cached = await cache.mget<number>([
      'food-attributes:a',
      'food-attributes:b',
      'food-attributes:c',
    ]);

    expect(cached).toEqual([1, 2, 3]);
  });

  it('set and get multiple items with an expiration time', async () => {
    const data = { 'food-attributes:d': 1, 'food-attributes:e': 2, 'food-attributes:f': 3 };

    await cache.mset(data, 0.2);
    const cached = await cache.mget<number>([
      'food-attributes:d',
      'food-attributes:e',
      'food-attributes:f',
    ]);
    expect(cached).toEqual([1, 2, 3]);

    await delay(300);

    const cachedAfterDelay = await cache.mget<number>([
      'food-attributes:d',
      'food-attributes:e',
      'food-attributes:f',
    ]);
    expect(cachedAfterDelay).toEqual([null, null, null]);
  });

  it('remember many - fetch missing', async () => {
    const stage1 = await cache.rememberMany(
      ['one', 'two'],
      'food-attributes',
      60,
      (keys: string[]) => getData(keys, ['one', 'two']),
    );

    expect(stage1).toEqual({ one: 1, two: 2 });

    const stage2 = await cache.rememberMany(
      ['one', 'two', 'three', 'four', 'five'],
      'food-attributes',
      60,
      (keys: string[]) => getData(keys, ['three', 'four', 'five']),
    );

    expect(stage2).toEqual(data);
  });

  it('remember many - no data available', async () => {
    const response = await cache.rememberMany(
      ['something'],
      'food-attributes',
      60,
      (keys: string[]) => getData(keys, ['something']),
    );

    expect(response).toEqual({ something: null });
  });

  it('remember many - should not crash on empty input', async () => {
    const response = await cache.rememberMany([], 'food-attributes', 60, (keys: string[]) =>
      getData(keys, []));

    expect(response).toEqual({});
  });
});
