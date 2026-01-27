import type { UserPhysicalDataAttributes } from '@intake24/db';

import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { feedbackPhysicalDataFields } from '@intake24/common/feedback';
import { FeedbackScheme, Survey, UserPhysicalData } from '@intake24/db';

export default () => {
  const url = '/api/user/physical-data';

  let userPhysicalData: UserPhysicalDataAttributes;

  let feedbackScheme: FeedbackScheme;
  let survey: Survey;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);

    feedbackScheme = await FeedbackScheme.create(mocker.system.feedbackScheme());

    const { userId } = suite.data.system.respondent;

    userPhysicalData = {
      userId,
      sex: 'f',
      weightKg: 70,
      heightCm: 175,
      physicalActivityLevelId: '1',
      birthdate: 1965,
      weightTarget: 'keep_weight',
    };
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', `${url}?survey=${survey.slug}`, {
      bearer: 'respondent',
    });
  });

  it('should return 404 for invalid survey', async () => {
    await suite.sharedTests.assertMissingRecord('get', `${url}?survey=nonExistingSurvey`, {
      bearer: 'respondent',
    });
  });

  it('should return 403 when no feedback scheme assigned', async () => {
    await suite.sharedTests.assertMissingAuthorization('get', `${url}?survey=${survey.slug}`, {
      bearer: 'respondent',
    });
  });

  it('should return null when no physical data for user', async () => {
    await Promise.all([
      survey.update({ feedbackSchemeId: feedbackScheme.id }),
      feedbackScheme.update({ physicalDataFields: [...feedbackPhysicalDataFields] }),
    ]);

    const { status, body } = await request(suite.app)
      .get(`${url}?survey=${survey.slug}`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.respondent);

    expect(status).toBe(200);
    expect(body).toBeNull();
  });

  it('should return 200 and user physical data', async () => {
    await UserPhysicalData.create(userPhysicalData);
    await suite.sharedTests.assertRecord('get', url, userPhysicalData, { bearer: 'respondent' });
  });
};
