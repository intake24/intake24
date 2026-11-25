import type { Express, Request, Response } from 'express';

import request from 'supertest';

import { deviceCookie, emailAccountKey, loginRateLimit } from '@intake24/api/http/rate-limit';

import { memoryBuckets, testApp } from './helpers';

const cookieName = 'device';
const password = 'correctPassword';

describe('login rate limit', () => {
  const cookie = deviceCookie({ secret: 'aTestSecret', maxAge: 60_000, maxEntries: 5 });
  let app: Express;

  beforeEach(() => {
    app = testApp();
    app.post(
      '/login',
      loginRateLimit({
        bucket: memoryBuckets({
          loginDevice: 2,
          loginAccountIp: 2,
          loginAccount: 4,
          loginIp: 6,
        }),
        deviceCookie: cookie,
        cookieName,
        account: req => emailAccountKey(req.body?.email),
      }),
      (req: Request, res: Response) => {
        res.status(req.body.password === password
          ? 200
          : 401).json();
      },
    );
    app.post(
      '/login/token',
      loginRateLimit({
        bucket: memoryBuckets({
          loginDevice: 2,
          loginAccountIp: 2,
          loginAccount: 4,
          loginIp: 6,
        }),
        deviceCookie: cookie,
        cookieName,
      }),
      (req: Request, res: Response) => {
        res.status(401).json();
      },
    );
  });

  const login = (ip: string, email: string, pass = 'wrongPassword', device?: string) => {
    const req = request(app).post('/login').set('X-Forwarded-For', ip);
    if (device)
      req.set('Cookie', `${cookieName}=${device}`);

    return req.send({ email, password: pass });
  };

  const fail = async (count: number, ip: string, email: string, device?: string) => {
    for (let i = 0; i < count; i++) {
      const { status } = await login(ip, email, 'wrongPassword', device);
      expect(status).toBe(401);
    }
  };

  it('should limit failures per account and IP', async () => {
    await fail(2, '203.0.113.1', 'user@example.com');

    expect((await login('203.0.113.1', 'user@example.com', password)).status).toBe(429);
    expect((await login('203.0.113.2', 'user@example.com', password)).status).toBe(200);
  });

  it('should count letter case variants of an email as the same account', async () => {
    await fail(1, '203.0.113.1', 'user@example.com');
    await fail(1, '203.0.113.1', 'USER@example.com');

    expect((await login('203.0.113.1', 'User@Example.com')).status).toBe(429);
  });

  it('should limit failures per account across IPs', async () => {
    await fail(2, '203.0.113.1', 'user@example.com');
    await fail(2, '203.0.113.2', 'user@example.com');

    expect((await login('203.0.113.3', 'user@example.com', password)).status).toBe(429);
  });

  it('should limit failures per IP across accounts', async () => {
    for (let i = 0; i < 6; i++)
      await fail(1, '203.0.113.1', `user${i}@example.com`);

    expect((await login('203.0.113.1', 'another@example.com', password)).status).toBe(429);
    expect((await login('203.0.113.2', 'another@example.com', password)).status).toBe(200);
  });

  it('should apply IP limit to logins without an account', async () => {
    for (let i = 0; i < 6; i++)
      expect((await request(app).post('/login/token').set('X-Forwarded-For', '203.0.113.1').send({ token: 't' })).status).toBe(401);

    expect((await request(app).post('/login/token').set('X-Forwarded-For', '203.0.113.1').send({ token: 't' })).status).toBe(429);
  });

  it('should apply IP limit to invalid email input', async () => {
    for (let i = 0; i < 6; i++)
      await fail(1, '203.0.113.1', `${'a'.repeat(600)}@example.com`);

    expect((await login('203.0.113.1', 'user@example.com', password)).status).toBe(429);
  });

  it('should let a device cookie bypass an exhausted account limit', async () => {
    const device = cookie.issue(undefined, emailAccountKey('user@example.com')!);

    await fail(2, '203.0.113.1', 'user@example.com');
    await fail(2, '203.0.113.2', 'user@example.com');
    expect((await login('203.0.113.3', 'user@example.com', password)).status).toBe(429);

    expect((await login('203.0.113.3', 'user@example.com', password, device)).status).toBe(200);
  });

  it('should ignore a device cookie issued for another account', async () => {
    const device = cookie.issue(undefined, emailAccountKey('other@example.com')!);

    await fail(2, '203.0.113.1', 'user@example.com');

    expect((await login('203.0.113.1', 'user@example.com', password, device)).status).toBe(429);
  });

  it('should fall back to account and IP limits once the device limit is exhausted', async () => {
    const device = cookie.issue(undefined, emailAccountKey('user@example.com')!);

    await fail(2, '203.0.113.1', 'user@example.com', device);
    expect((await login('203.0.113.1', 'user@example.com', 'wrongPassword', device)).status).toBe(401);
    expect((await login('203.0.113.1', 'user@example.com', 'wrongPassword', device)).status).toBe(401);

    expect((await login('203.0.113.1', 'user@example.com', password, device)).status).toBe(429);
  });

  it('should not count device cookie failures against the IP limit', async () => {
    const device = cookie.issue(undefined, emailAccountKey('user@example.com')!);
    await fail(2, '203.0.113.1', 'user@example.com', device);

    for (let i = 0; i < 4; i++)
      await fail(1, '203.0.113.1', `user${i}@example.com`);

    expect((await login('203.0.113.1', 'another@example.com')).status).toBe(401);
  });
});
