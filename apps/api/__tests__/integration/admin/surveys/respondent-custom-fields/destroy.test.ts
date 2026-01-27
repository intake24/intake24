import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { CreateRespondentRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey, UserSurveyAlias } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:respondents'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidRespondentUrl: string;
  let invalidUrl: string;

  let survey: Survey;
  let respondent: UserSurveyAlias;

  let respondentInput: CreateRespondentRequest;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create({
      ...surveyInput,
      userCustomFields: true,
    });

    securable = { securableId: survey.id, securableType: 'Survey' };

    respondentInput = mocker.system.respondent();
    respondent = await ioc.cradle.adminSurveyService.createRespondent(
      survey.id,
      respondentInput,
    );
    const field = respondentInput.customFields!.at(0)!.name;

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${field}`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}/custom-fields/${field}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999/custom-fields/${field}`;
    invalidUrl = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/invalid-field`;
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

    it(`should return 404 when respondent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidRespondentUrl);
    });

    it(`should return 404 when field record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it(`should return 403 when user custom fields disabled`, async () => {
      await survey.update({ userCustomFields: false });
      await suite.sharedTests.assertMissingAuthorization('delete', url);
    });

    it('should return 204 and no content', async () => {
      await survey.update({ userCustomFields: true });
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 204 and no content when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const field2 = respondentInput.customFields!.at(1)!.name;
      const url2 = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${field2}`;

      await suite.sharedTests.assertRecordDeleted('delete', url2);
    });

    it('should return 204 and no content when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const field3 = respondentInput.customFields!.at(2)!.name;
      const url3 = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${field3}`;

      await suite.sharedTests.assertRecordDeleted('delete', url3);
    });
  });
};
