import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';
import ioc from '@intake24/api/ioc';

export default () => {
  const url = '/api/user/password';

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url, { bearer: 'respondent' });
  });

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput(
      'post',
      url,
      ['password', 'passwordConfirm', 'passwordCurrent'],
      { bearer: 'respondent' },
    );
  });

  it('should return 400 for weak new passwords', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['password', 'passwordConfirm'], {
      bearer: 'respondent',
      input: {
        password: 'weakpassword',
        passwordConfirm: 'weakpassword',
        passwordCurrent: 'testRespondentPassword',
      },
    });
  });

  it('should return 400 for not matching new passwords', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['passwordConfirm'], {
      bearer: 'respondent',
      input: {
        password: 'newPassword123',
        passwordConfirm: 'notMatchingNewPassword123',
        passwordCurrent: 'testRespondentPassword',
      },
    });
  });

  it('should return 400 for invalid current password', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['passwordCurrent'], {
      bearer: 'respondent',
      input: {
        password: 'newPassword123',
        passwordConfirm: 'newPassword123',
        passwordCurrent: 'invalidPassword',
      },
    });
  });

  it('should return 200', async () => {
    await suite.sharedTests.assertAcknowledged('post', url, {
      bearer: 'respondent',
      input: {
        password: 'newPassword123',
        passwordConfirm: 'newPassword123',
        passwordCurrent: 'testRespondentPassword',
      },
    });
  });

  it('should revoke existing refresh tokens', async () => {
    const email = 'password-change-revoke@example.com';
    const password = 'oldPassword123';
    await ioc.cradle.adminUserService.create({
      email,
      password,
      verifiedAt: new Date(),
    });

    const loginRes = await request(suite.app)
      .post('/api/admin/auth/login')
      .set('Accept', 'application/json')
      .send({ email, password });
    expect(loginRes.status).toBe(200);

    const refreshCookie = loginRes.get('Set-Cookie')?.find(
      cookie => cookie.startsWith(`${securityConfig.jwt.admin.cookie.name}=`),
    )?.split(';').at(0);
    expect(refreshCookie).toBeDefined();

    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({ password: 'newPassword123', passwordConfirm: 'newPassword123', passwordCurrent: password });
    expect(status).toBe(200);

    const refreshRes = await request(suite.app)
      .post('/api/admin/auth/refresh')
      .set('Accept', 'application/json')
      .set('Cookie', [refreshCookie!]);
    expect(refreshRes.status).toBe(401);
  });
};
