import type { Request } from 'express';

import { isLoopbackRequest } from '@intake24/api/services/core/redis/rate-limiter';

describe('rate limiter', () => {
  it('recognises IPv4-mapped loopback addresses', () => {
    expect(isLoopbackRequest({ ip: '::ffff:127.0.0.1' } as Request)).toBe(true);
  });
});
