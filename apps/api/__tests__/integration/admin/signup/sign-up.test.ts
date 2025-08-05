import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';
import ioc from '@intake24/api/ioc';

export default () => {
  const url = '/api/admin/sign-up';

  const input = {
    name: 'A Researcher',
    phone: '0123456789',
    email: 'researcher@example.com',
    emailConfirm: 'researcher@example.com',
    password: 'newPassword123',
    passwordConfirm: 'newPassword123',
    terms: true,
    captcha: 'test-captcha',
  };

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, [
      'name',
      'email',
      'emailConfirm',
      'password',
      'passwordConfirm',
      'terms',
    ]);
  });

  it('should return 400 for invalid input data #1', async () => {
    const invalidInput = {
      name: ['name should be string'],
      phone: { value: 'phone should be string' },
      email: 'notAnEmail',
      emailConfirm: '',
      password: 'tooSimple',
      passwordConfirm: ['notMatchingTooSimple'],
      terms: false,
    };

    await suite.sharedTests.assertInvalidInput(
      'post',
      url,
      ['name', 'phone', 'email', 'emailConfirm', 'password', 'passwordConfirm', 'terms'],
      { input: invalidInput },
    );
  });

  it('should return 400 for invalid input data #2', async () => {
    const invalidInput = {
      name: 'name',
      phone: '123456789',
      email: 'matching@email.com',
      emailConfirm: 'notMatching@email.com',
      password: 'FB37rg2hj7kd&sfd',
      passwordConfirm: 'FN8934r3yg8hf70ukj2sdf',
      terms: true,
    };

    await suite.sharedTests.assertInvalidInput('post', url, ['emailConfirm', 'passwordConfirm'], {
      input: invalidInput,
    });
  });

  it('should return 403 when sign-ups disabled', async () => {
    ioc.cradle.aclConfig.signup.enabled = false;

    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send(input);

    expect(status).toBe(403);
  });

  describe('sign-ups enabled', () => {
    beforeAll(async () => {
      ioc.cradle.aclConfig.signup.enabled = true;
    });

    it('should return 200, access token & refresh cookie', async () => {
      const res = await request(suite.app).post(url).set('Accept', 'application/json').send(input);

      expect(res.status).toBe(200);
      expect(res.body).toContainAllKeys(['accessToken']);

      expect(res.get('Set-Cookie')?.length).toBeGreaterThanOrEqual(1);
      expect(
        (res.get('Set-Cookie') ?? []).some(
          cookie => cookie.split('=')[0] === securityConfig.jwt.admin.cookie.name,
        ),
      ).toBe(true);
    });

    it('should return 400 for duplicate email', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['email'], { input });
    });
  });
};
