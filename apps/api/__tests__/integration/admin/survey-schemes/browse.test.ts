import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const url = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes:browse'];

  let surveyScheme: SurveyScheme;

  beforeAll(async () => {
    const input = mocker.system.surveyScheme();

    surveyScheme = await SurveyScheme.create(input);
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  describe('authenticated / resource authorized', () => {
    it('should return 200 and paginated results', async () => {
      await suite.util.setPermission(permissions);

      await suite.sharedTests.assertPaginatedResult('get', url, { result: true });
    });

    it('should return 403 without any record access', async () => {
      await suite.util.setPermission([]);

      await suite.sharedTests.assertMissingAuthorization('get', url);
    });

    it('should return 200 and with record access', async () => {
      await suite.util.setSecurable({
        securableId: surveyScheme.id,
        securableType: 'SurveyScheme',
        action: ['edit'],
      });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: surveyScheme.id });
    });
  });
};
