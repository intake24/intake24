import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { CustomField } from '@intake24/common/types';
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

  let input: CustomField;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create({
      ...surveyInput,
      userCustomFields: true,
    });

    securable = { securableId: survey.id, securableType: 'Survey' };

    const respondentInput = mocker.system.respondent();
    respondent = await ioc.cradle.adminSurveyService.createRespondent(survey.id, respondentInput);
    input = { ...mocker.system.customField(), name: respondentInput.customFields!.at(0)!.name };

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${input.name}`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}/custom-fields/${input.name}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999/custom-fields/${input.name}`;
    invalidUrl = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/invalid-field`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('patch', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidSurveyUrl, { input });
    });

    it(`should return 404 when user record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidRespondentUrl, { input });
    });

    it(`should return 404 when field record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidUrl, { input });
    });

    it('should return 400 for invalid input data #1', async () => {
      await suite.sharedTests.assertInvalidInput(
        'patch',
        url,
        ['value', 'public'],
        {
          input: {
            value: [new Date()],
            public: 'false',
          },
        },
      );
    });

    it(`should return 403 when user custom fields disabled`, async () => {
      await survey.update({ userCustomFields: false });
      await suite.sharedTests.assertMissingAuthorization('patch', url, { input });
    });

    it('should return 200 and data', async () => {
      await survey.update({ userCustomFields: true });
      await suite.sharedTests.assertRecordUpdated('patch', url, input, { input });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and no content when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const input2 = mocker.system.customField();
      await suite.sharedTests.assertRecordUpdated('patch', url, { ...input2, name: input.name }, { input: input2 });
    });

    it('should return 200 and no content when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const input3 = mocker.system.customField();
      await suite.sharedTests.assertRecordUpdated('patch', url, { ...input3, name: input.name }, { input: input3 });
    });
  });
};
