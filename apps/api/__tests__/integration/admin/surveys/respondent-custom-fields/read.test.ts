import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { CustomField } from '@intake24/common/types';
import type { CreateRespondentRequest } from '@intake24/common/types/http/admin';
import type { UserSurveyAlias } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:respondents'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidRespondentUrl: string;
  let invalidUrl: string;

  let survey: Survey;
  let respondent: UserSurveyAlias;

  let input: CreateRespondentRequest;
  let output: CustomField;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create({
      ...surveyInput,
      userCustomFields: true,
    });

    securable = { securableId: survey.id, securableType: 'Survey' };

    input = mocker.system.respondent();
    respondent = await ioc.cradle.adminSurveyService.createRespondent(survey.id, input);
    output = input.customFields!.at(0)!;

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${output.name}`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}/custom-fields/${output.name}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999/custom-fields/${output.name}`;
    invalidUrl = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/invalid-field`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidSurveyUrl);
    });

    it(`should return 404 when respondent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidRespondentUrl);
    });

    it(`should return 404 when field record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
