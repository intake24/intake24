import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { CustomField } from '@intake24/common/types';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey, UserSurveyAlias } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:respondents'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidRespondentUrl: string;

  let survey: Survey;
  let respondent: UserSurveyAlias;

  let input: CustomField;
  let output: CustomField;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create({
      ...surveyInput,
      userCustomFields: true,
    });

    securable = { securableId: survey.id, securableType: 'Survey' };

    respondent = await ioc.cradle.adminSurveyService.createRespondent(survey.id, mocker.system.respondent());
    input = mocker.system.customField();
    output = { ...input };

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields/${input.name}`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}/custom-fields/${input.name}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999/custom-fields/${input.name}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidSurveyUrl, { input });
    });

    it(`should return 404 when respondent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidRespondentUrl, { input });
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['value']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        ['value', 'public'],
        {
          input: {
            value: ['array'],
            public: [true],
          },
        },
      );
    });

    it(`should return 403 when user custom fields disabled`, async () => {
      await survey.update({ userCustomFields: false });
      await suite.sharedTests.assertMissingAuthorization('put', url, { input });
    });

    it('should return 201 and new resource', async () => {
      await survey.update({ userCustomFields: true });
      await suite.sharedTests.assertRecordInserted('put', url, output, { input });
    });

    it('should return 200 and updated data', async () => {
      const updateOutput = { ...mocker.system.customField(), name: input.name };
      await suite.sharedTests.assertRecordUpdated('put', url, updateOutput, { input: updateOutput });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const output2 = { ...mocker.system.customField(), name: input.name };
      await suite.sharedTests.assertRecordUpdated('put', url, output2, { input: output2 });
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const output3 = { ...mocker.system.customField(), name: input.name };
      await suite.sharedTests.assertRecordUpdated('put', url, output3, { input: output3 });
    });
  });
};
