import type { MockInstance } from 'vitest';

import ms from 'ms';
import request from 'supertest';
import { vi } from 'vitest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { sleep } from '@intake24/api/util';
import { UserPasswordReset } from '@intake24/db';

let dateNowSpy: MockInstance;

export default () => {
  const url = '/api/password/reset';

  let userId: string;
  let email: string;
  let token: string;

  beforeAll(async () => {
    const user = await ioc.cradle.adminUserService.create({
      email: 'testUserReset@example.com',
      password: 'testUserResetPassword',
      permissions: [],
      roles: [],
    });

    const { id, email: userEmail } = user;
    if (!userEmail)
      throw new Error('User email not found.');

    userId = id;
    email = userEmail;

    await UserPasswordReset.destroy({ where: { userId } });

    await request(suite.app)
      .post('/api/password')
      .set('Accept', 'application/json')
      .send({ email, captcha: 'captchaToken' });

    await sleep(2000); // TODO: this should wait until the job is done
    const reset = await UserPasswordReset.findOne({ where: { userId } });
    if (!reset)
      throw new Error('Password reset not created.');

    token = reset.token;
  });

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput(
      'post',
      url,
      ['email', 'token', 'password', 'passwordConfirm'],
      { bearer: undefined },
    );
  });

  it(`should return 400 for invalid input data`, async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({
        email: 'notAnEmail',
        token: [true],
        password: 'tooShort',
        passwordConfirm: 'notMatching',
      });

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['email', 'token', 'password', 'passwordConfirm']);
  });

  it('should return 400 for invalid token', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({
        email,
        token: 'invalidToken',
        password: 'newPassword123',
        passwordConfirm: 'newPassword123',
      });

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['token']);
  });

  describe('shift time forward to expire token', () => {
    beforeAll(() => {
      const timeShift = Date.now() + ms(ioc.cradle.securityConfig.passwords.expiresIn);
      dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => timeShift);
    });

    it('should return 400 for expired token ', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({
          email,
          token,
          password: 'newPassword123',
          passwordConfirm: 'newPassword123',
        });

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['token']);
    });

    afterAll(() => {
      dateNowSpy.mockRestore();
    });
  });

  it('should return 200', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({
        email,
        token,
        password: 'newPassword123',
        passwordConfirm: 'newPassword123',
      });

    expect(status).toBe(200);
    expect(body).toBeEmpty();
  });
};
