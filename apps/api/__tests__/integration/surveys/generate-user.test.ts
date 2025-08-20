import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  let url: string;
  let invalidUrl: string;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/generate-user`;
    invalidUrl = `/api/surveys/invalid-survey/generate-user`;
  });

  it(`should return 404 when record doesn't exist`, async () => {
    await suite.sharedTests.assertMissingRecord('post', invalidUrl, {
      bearer: null,
      input: { captcha: 'captchaToken' },
    });
  });

  it(`should return 403 when user generation disabled`, async () => {
    await suite.data.system.Survey.update({ allowGenUsers: false });

    await suite.sharedTests.assertMissingAuthorization('post', url, {
      bearer: null,
      input: { captcha: 'captchaToken' },
    });
  });

  it(`should return 403 when user generation enabled and JWT secret set`, async () => {
    await suite.data.system.Survey.update({ allowGenUsers: true, genUserKey: 'aSuperSecret' });

    await suite.sharedTests.assertMissingAuthorization('post', url, {
      bearer: null,
      input: { captcha: 'captchaToken' },
    });
  });

  it('should return 200 and generated credentials', async () => {
    await suite.data.system.Survey.update({ allowGenUsers: true, genUserKey: null });

    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .send({ captcha: 'captchaToken' });

    expect(status).toBe(200);
    expect(body).toContainAllKeys(['username', 'password']);
  });
};
