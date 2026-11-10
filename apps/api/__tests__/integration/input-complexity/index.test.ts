import { gzipSync } from 'node:zlib';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

/*
 * Unauthenticated endpoints accept input from anyone, and gzip lets a client send a large repetitive
 * body in very few bytes, so any processing step that grows faster than n log n (e.g. quadratic)
 * before or during request validation can be used to block the event loop.
 */
export default () => {
  const url = '/api/admin/auth/login';

  // Growth ratios are used instead of absolute time limits because they do not depend on how fast the
  // machine is, and they work with inputs small enough to stay well within the request body size limit.
  // An absolute limit would need inputs large enough for quadratic processing to take seconds, which ties
  // the test to the body size limit. The timeout is only a backstop for a hung request.
  //
  // An 8x larger input should take ~8x longer if processing is linear, ~10x if n log n, ~64x if quadratic.
  // The base size must be large enough for quadratic processing to dominate the fixed per-request
  // overhead, which would otherwise pull the quadratic ratio towards 1.
  //
  // Nominally the limit rejects anything growing faster than ~n^1.44 (8^1.44 ≈ 20), so even n^1.5 (~23x)
  // would fail, but that is not reliable: fixed overhead lowers the measured ratio and timings vary across
  // machines. The limit is set with headroom on both sides to reliably separate n log n from quadratic.
  const baseSize = 10_000;
  const sizeFactor = 8;
  const maxGrowth = 20;
  const runs = 3;
  const timeout = 10_000;

  const range = (n: number) => Array.from({ length: n }, (_, i) => i);

  // All inputs are invalid login requests, so a 400 means the body went through the whole pipeline up to
  // validation. Any other status means the request was cut short and its timing measures nothing.
  const post = async (json: string) => {
    const body = gzipSync(json);
    const start = performance.now();
    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'gzip')
      // superagent would JSON-serialize the buffer because of the content type
      .serialize(data => data)
      .send(body);

    return { status, elapsed: performance.now() - start };
  };

  // Noise (GC, scheduling) only ever adds time, so the fastest run is the best estimate
  const fastest = async (json: string) => {
    let min = Infinity;
    for (let i = 0; i < runs; i++) {
      const { status, elapsed } = await post(json);
      expect(status).toBe(400);
      min = Math.min(min, elapsed);
    }
    return min;
  };

  const shapes: [string, (n: number) => unknown][] = [
    [
      'top-level array',
      n => range(n).map(() => 0),
    ],
    [
      'top-level object with unique keys',
      n => Object.fromEntries(range(n).map(i => [`k${i}`, 0])),
    ],
    [
      'wide array nested in object',
      n => ({
        email: 'x',
        password: 'y',
        items: range(n).map(() => ' x '),
      }),
    ],
    [
      'wide object nested in array',
      n => [
        Object.fromEntries(range(n).map(i => [`k${i}`, 0])),
      ],
    ],
    [
      'array of small objects',
      n => range(n).map(() => ({ a: ' x ' })),
    ],
  ];

  it.each(shapes)('processing time of %s should grow linearly with its size', async (_, shape) => {
    const small = JSON.stringify(shape(baseSize));
    const large = JSON.stringify(shape(baseSize * sizeFactor));

    await post(small);
    const growth = await fastest(large) / await fastest(small);

    expect(growth).toBeLessThan(maxGrowth);
  }, timeout);

  // The body is 100k arrays nested inside each other: [[[[...]]]].
  // V8's JSON.parse is not recursive and accepts this, but any recursive processing of the parsed body
  // exceeds the call stack (~10k frames) and fails with a RangeError (500) unless it limits depth first.
  // The input is ~200 KB raw and a few hundred bytes gzipped.
  it('extremely deep nesting should be rejected with 400', async () => {
    const depth = 100_000;
    const { status } = await post(`${'['.repeat(depth)}${']'.repeat(depth)}`);

    expect(status).toBe(400);
  }, timeout);
};
