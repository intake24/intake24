import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/password';

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['email'], {
      bearer: undefined,
    });
  });

  it(`should return 400 for invalid input data`, async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ email: 'notAnEmail', captcha: [] });

    expect(status).toBe(400);
    expect(body).toContainAllKeys(['errors', 'message']);
    expect(body.errors).toContainAllKeys(['email', 'captcha']);
  });

  it('should return 200 for valid email', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ email: 'test-user@example.com', captcha: 'captchaToken' });

    expect(status).toBe(200);
    expect(body).toBeEmpty();
  });

  it('should return 200 for invalid email', async () => {
    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ email: 'emailNotInDatabase@example.com', captcha: 'captchaToken' });

    expect(status).toBe(200);
    expect(body).toBeEmpty();
  });
};
