import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveySubmission } from '@intake24/db';

export default () => {
  const url = '/api/user/feedback/submissions';
  let surveyId: string;
  let surveySlug: string;
  let userId: string;
  let submissionId: string;

  beforeAll(async () => {
    surveyId = suite.data.system.Survey.id;
    surveySlug = suite.data.system.Survey.slug;
    userId = suite.data.system.respondent.userId;

    const submission = await SurveySubmission.create(mocker.system.submission(surveyId, userId));
    submissionId = submission.id;
  });

  afterAll(async () => {
    await SurveySubmission.destroy({ where: { userId } });
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url, { bearer: 'respondent' });
  });

  it('should return 400 for missing surveyId query parameter', async () => {
    await suite.sharedTests.assertInvalidInput('get', url, ['survey'], { bearer: 'respondent' });
  });

  it('should return 404 for invalid survey', async () => {
    await suite.sharedTests.assertMissingRecord('get', `${url}?survey=nonExistingSurvey`, {
      bearer: 'respondent',
    });
  });

  it('should return 200 and array of submissions', async () => {
    await suite.sharedTests.assertPaginatedResult('get', `${url}?survey=${surveySlug}`, {
      bearer: 'respondent',
      result: submissionId,
    });
  });
};
