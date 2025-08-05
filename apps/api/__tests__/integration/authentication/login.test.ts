import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';

export default () => {
  const url = '/api/auth/login';

  it('missing credentials should return 400 with errors', async () => {
    const res = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({});

    const { status, body } = res;

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['email', 'password', 'survey']);
  });

  it('invalid credentials should return 401', async () => {
    const { status } = await request(suite.app).post(url).set('Accept', 'application/json').send({
      email: 'testUser@example.com',
      password: 'invalidPassword',
      survey: 'test-survey',
      captcha: 'test-captcha',
    });

    expect(status).toBe(401);
  });

  it('valid credentials should return 200, access token & refresh cookie', async () => {
    const res = await request(suite.app).post(url).set('Accept', 'application/json').send({
      email: 'testUser@example.com',
      password: 'testUserPassword',
      survey: 'test-survey',
      captcha: 'test-captcha',
    });

    expect(res.status).toBe(200);
    expect(res.body).toContainAllKeys(['accessToken']);

    expect(res.get('Set-Cookie')?.length).toBeGreaterThanOrEqual(1);
    expect(
      (res.get('Set-Cookie') ?? []).some(
        cookie => cookie.split('=')[0] === securityConfig.jwt.survey.cookie.name,
      ),
    ).toBe(true);
  });

  it('valid credentials should return 200, access token & refresh cookie (case-insensitive)', async () => {
    const res = await request(suite.app).post(url).set('Accept', 'application/json').send({
      email: 'testUser@example.com',
      password: 'testUserPassword',
      survey: 'tEst-sUrvey',
      captcha: 'test-captcha',
    });

    expect(res.status).toBe(200);
    expect(res.body).toContainAllKeys(['accessToken']);

    expect(res.get('Set-Cookie')?.length).toBeGreaterThanOrEqual(1);
    expect(
      (res.get('Set-Cookie') ?? []).some(
        cookie => cookie.split('=')[0] === securityConfig.jwt.survey.cookie.name,
      ),
    ).toBe(true);
  });
};
