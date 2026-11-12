import type { Request } from 'express';

import { isLoopbackRequest } from '@intake24/api/services/core/redis/rate-limiter';

describe('rate limiter', () => {
  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])('recognises %s as loopback', (ip) => {
    expect(isLoopbackRequest({ ip } as Request)).toBe(true);
  });

  it.each([
    '192.168.0.1',
    '2001:db8::1',
    '::ffff:192.168.0.1',
    undefined,
  ])('does not treat %s as loopback', (ip) => {
    expect(isLoopbackRequest({ ip } as Request)).toBe(false);
  });
});
