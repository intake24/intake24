import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';
import { User } from '@intake24/db';

export default () => {
  const url = '/api/admin/auth/login';

  it('missing credentials should return 400 with errors', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({});

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['email', 'password']);
  });

  it('invalid credentials should return 401', async () => {
    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ email: 'testUser@example.com', password: 'invalidPassword' });

    expect(status).toBe(401);
  });

  it('valid credentials should return 200, access token & refresh cookie', async () => {
    const res = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ email: 'testUser@example.com', password: 'testUserPassword' });

    expect(res.status).toBe(200);
    expect(res.body).toContainAllKeys(['accessToken']);

    expect(res.get('Set-Cookie')?.length).toBeGreaterThanOrEqual(1);
    expect(
      (res.get('Set-Cookie') ?? []).some(
        cookie => cookie.split('=')[0] === securityConfig.jwt.admin.cookie.name,
      ),
    ).toBe(true);
  });

  describe('user disabled', () => {
    beforeAll(async () => {
      await User.update({ disabledAt: new Date() }, { where: { email: 'testUser@example.com' } });
    });

    it('should return 401 when user disabled', async () => {
      const { status } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ email: 'testUser@example.com', password: 'testUserPassword' });

      expect(status).toBe(401);
    });

    afterAll(async () => {
      await User.update({ disabledAt: null }, { where: { email: 'testUser@example.com' } });
    });
  });
};
