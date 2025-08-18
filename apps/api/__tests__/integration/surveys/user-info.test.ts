import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  let url: string;
  let invalidUrl: string;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.survey.slug}/user-info`;
    invalidUrl = `/api/surveys/invalid-survey/user-info`;
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('get', invalidUrl, {
      bearer: 'respondent',
    });
  });

  it('should return 400 for missing timezone offset', async () => {
    await suite.sharedTests.assertInvalidInput('get', url, ['tzOffset'], {
      bearer: 'respondent',
    });
  });

  it('should return 400 for invalid timezone offset', async () => {
    await suite.sharedTests.assertInvalidInput(
      'get',
      `${url}?tzOffset=invalidTzOffset`,
      ['tzOffset'],
      { bearer: 'respondent' },
    );
  });

  it('should return 200 and user info', async () => {
    const { status, body } = await request(suite.app)
      .get(`${url}?tzOffset=-60`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.respondent);

    expect(status).toBe(200);
    expect(body).toContainAllKeys([
      'userId',
      'name',
      'submissions',
      'customFields',
      'showFeedback',
      'maximumTotalSubmissionsReached',
      'maximumDailySubmissionsReached',
    ]);
  });
};
