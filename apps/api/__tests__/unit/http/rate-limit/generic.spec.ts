import type { Express } from 'express';

import jwt from 'jsonwebtoken';
import request from 'supertest';

import { genericRateLimit } from '@intake24/api/http/rate-limit';

import { memoryBuckets, testApp } from './helpers';

const secret = 'aTestSecretThatIsLongEnoughForTesting';
const issuer = 'intake24';

function token(userId: string, audience: string[], signWith = secret) {
  return `Bearer ${jwt.sign({ userId }, signWith, { issuer, audience })}`;
}

describe('generic rate limit', () => {
  let app: Express;

  beforeEach(() => {
    app = testApp();
    app.use(genericRateLimit(
      memoryBuckets({ genericAnonymous: 2, genericSurveyUser: 2, genericAdminUser: 3 }),
      { secret, issuer },
    ));
    app.get('/{*rest}', (req, res) => {
      res.status(200).json();
    });
  });

  const get = (ip: string, bearer?: string) => {
    const req = request(app).get('/resource').set('X-Forwarded-For', ip);
    return bearer
      ? req.set('Authorization', bearer)
      : req;
  };

  const exhaust = async (count: number, ip: string, bearer?: string) => {
    for (let i = 0; i < count; i++)
      expect((await get(ip, bearer)).status).toBe(200);
  };

  it('should limit anonymous requests per IP', async () => {
    await exhaust(2, '203.0.113.1');

    expect((await get('203.0.113.1')).status).toBe(429);
    expect((await get('203.0.113.2')).status).toBe(200);
  });

  it('should limit authenticated requests per user, not per IP', async () => {
    const alice = token('1', ['survey', 'access']);
    const bob = token('2', ['survey', 'access']);

    await exhaust(2, '203.0.113.1', alice);

    expect((await get('203.0.113.1', alice)).status).toBe(429);
    expect((await get('203.0.113.2', alice)).status).toBe(429);
    expect((await get('203.0.113.1', bob)).status).toBe(200);
    expect((await get('203.0.113.1')).status).toBe(200);
  });

  it('should not count authenticated requests against the anonymous IP limit', async () => {
    await exhaust(2, '203.0.113.1', token('1', ['survey', 'access']));
    await exhaust(2, '203.0.113.1', token('2', ['survey', 'access']));

    await exhaust(2, '203.0.113.1');
  });

  it('should use separate limits for admin and survey tokens of the same user', async () => {
    const admin = token('1', ['admin', 'access']);

    await exhaust(2, '203.0.113.1', token('1', ['survey', 'access']));

    await exhaust(3, '203.0.113.1', admin);
    expect((await get('203.0.113.1', admin)).status).toBe(429);
  });

  it.each([
    [
      'wrong secret',
      token('1', ['survey', 'access'], 'anotherSecretThatIsLongEnoughForTesting'),
    ],
    [
      'wrong audience',
      token('1', ['survey', 'refresh']),
    ],
    ['malformed token', 'Bearer not-a-token'],
  ])('should treat requests with %s as anonymous', async (_, bearer) => {
    await exhaust(2, '203.0.113.1', bearer);

    expect((await get('203.0.113.1')).status).toBe(429);
  });
});
