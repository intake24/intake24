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
    const data = { 'food-parent-cache:a': 1, 'food-parent-cache:b': 2, 'food-parent-cache:c': 3 };

    await cache.mset(data);
    const cached = await cache.mget<number>([
      'food-parent-cache:a',
      'food-parent-cache:b',
      'food-parent-cache:c',
    ]);

    expect(cached).toEqual([1, 2, 3]);
  });

  it('set and get multiple items with an expiration time', async () => {
    const data = { 'food-parent-cache:d': 1, 'food-parent-cache:e': 2, 'food-parent-cache:f': 3 };

    await cache.mset(data, 0.2);
    const cached = await cache.mget<number>([
      'food-parent-cache:d',
      'food-parent-cache:e',
      'food-parent-cache:f',
    ]);
    expect(cached).toEqual([1, 2, 3]);

    await delay(300);

    const cachedAfterDelay = await cache.mget<number>([
      'food-parent-cache:d',
      'food-parent-cache:e',
      'food-parent-cache:f',
    ]);
    expect(cachedAfterDelay).toEqual([null, null, null]);
  });

  it('remember many - fetch missing', async () => {
    const stage1 = await cache.rememberMany(
      ['one', 'two'],
      'food-parent-cache',
      60,
      (keys: string[]) => getData(keys, ['one', 'two']),
    );

    expect(stage1).toEqual({ one: 1, two: 2 });

    const stage2 = await cache.rememberMany(
      ['one', 'two', 'three', 'four', 'five'],
      'food-parent-cache',
      60,
      (keys: string[]) => getData(keys, ['three', 'four', 'five']),
    );

    expect(stage2).toEqual(data);
  });

  it('remember many - no data available', async () => {
    const response = await cache.rememberMany(
      ['something'],
      'food-parent-cache',
      60,
      (keys: string[]) => getData(keys, ['something']),
    );

    expect(response).toEqual({ something: null });
  });

  it('remember many - should not crash on empty input', async () => {
    const response = await cache.rememberMany([], 'food-parent-cache', 60, (keys: string[]) =>
      getData(keys, []));

    expect(response).toEqual({});
  });
});
