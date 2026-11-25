import type { Express, Request, Response } from 'express';

import request from 'supertest';

import { mfaVerifyRateLimit } from '@intake24/api/http/rate-limit';

import { memoryBuckets, testApp } from './helpers';

const code = '123456';

describe('mfa verify rate limit', () => {
  let app: Express;

  beforeEach(() => {
    app = testApp();
    app.use((req: Request, res, next) => {
      const userId = req.get('X-Test-User');
      req.session = (userId
        ? {
            mfaAuthChallenge: {
              challengeId: 'challenge',
              deviceId: '1',
              provider: 'otp',
              userId,
              amr: [],
            },
          }
        : {}) as Request['session'];
      next();
    });
    app.post(
      '/verify',
      mfaVerifyRateLimit(memoryBuckets({ mfaVerify: 2 })),
      (req: Request, res: Response) => {
        delete req.session.mfaAuthChallenge;
        res.status(req.body.code === code
          ? 200
          : 401).json();
      },
    );
  });

  const verify = (ip: string, userId: string | undefined, guess: string) => {
    const req = request(app).post('/verify').set('X-Forwarded-For', ip).send({ code: guess });
    return userId
      ? req.set('X-Test-User', userId)
      : req;
  };

  it('should limit failures per user across IPs', async () => {
    expect((await verify('203.0.113.1', '1', '000000')).status).toBe(401);
    expect((await verify('203.0.113.2', '1', '000000')).status).toBe(401);

    expect((await verify('203.0.113.3', '1', code)).status).toBe(429);
    expect((await verify('203.0.113.1', '2', code)).status).toBe(200);
  });

  it('should not count successful verifications', async () => {
    for (let i = 0; i < 3; i++)
      expect((await verify('203.0.113.1', '1', code)).status).toBe(200);

    expect((await verify('203.0.113.1', '1', '000000')).status).toBe(401);
  });

  it('should not count requests without an mfa challenge', async () => {
    for (let i = 0; i < 3; i++)
      expect((await verify('203.0.113.1', undefined, '000000')).status).toBe(401);

    expect((await verify('203.0.113.1', '1', code)).status).toBe(200);
  });
});
