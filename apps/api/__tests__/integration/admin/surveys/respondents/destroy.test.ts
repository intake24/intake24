import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:respondents'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidRespondentUrl: string;

  let survey: Survey;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);

    securable = { securableId: survey.id, securableType: 'Survey' };

    const respondent = await ioc.cradle.adminSurveyService.createRespondent(
      survey.id,
      mocker.system.respondent(),
    );

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidSurveyUrl);
    });

    it(`should return 404 when user record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidRespondentUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 204 and no content when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const { username } = await ioc.cradle.adminSurveyService.createRespondent(
        survey.id,
        mocker.system.respondent(),
      );
      const url2 = `${baseUrl}/${survey.id}/respondents/${username}`;

      await suite.sharedTests.assertRecordDeleted('delete', url2);
    });

    it('should return 204 and no content when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const { username } = await ioc.cradle.adminSurveyService.createRespondent(
        survey.id,
        mocker.system.respondent(),
      );
      const url3 = `${baseUrl}/${survey.id}/respondents/${username}`;

      await suite.sharedTests.assertRecordDeleted('delete', url3);
    });
  });
};
