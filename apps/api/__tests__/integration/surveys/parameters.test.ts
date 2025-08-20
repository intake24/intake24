import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  let url: string;
  let invalidUrl: string;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/parameters`;
    invalidUrl = `/api/surveys/invalid-survey/parameters`;
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('get', invalidUrl, {
      bearer: 'respondent',
    });
  });

  it('should return 200 and public survey parameters', async () => {
    const { status, body } = await request(suite.app)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.respondent);

    expect(status).toBe(200);
    expect(body).toContainAllKeys([
      'id',
      'slug',
      'name',
      'state',
      'locale',
      'surveyScheme',
      'feedbackScheme',
      'faqs',
      'numberOfSubmissionsForFeedback',
      'session',
      'suspensionReason',
      'searchSortingAlgorithm',
      'searchMatchScoreWeight',
    ]);
  });
};
