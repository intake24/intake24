import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';

export default () => {
  const url = '/api/auth/login/alias';

  it('missing credentials should return 400 with errors', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({});

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['username', 'password', 'survey']);
  });

  it('invalid credentials should return 401', async () => {
    const { status } = await request(suite.app).post(url).set('Accept', 'application/json').send({
      username: 'testRespondent',
      password: 'invalidPassword',
      survey: 'test-survey',
      captcha: 'test-captcha',
    });

    expect(status).toBe(401);
  });

  it('valid credentials should return 200, access token & refresh cookie', async () => {
    const res = await request(suite.app).post(url).set('Accept', 'application/json').send({
      username: 'testRespondent',
      password: 'testRespondentPassword',
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
      username: 'testRespondent',
      password: 'testRespondentPassword',
      survey: 'Test-Survey',
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
