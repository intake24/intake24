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

    url = `${baseUrl}/${survey.id}/respondents/${respondent.username}/custom-fields`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents/${respondent.username}/custom-fields`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/respondents/999999/custom-fields`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidSurveyUrl, { input });
    });

    it(`should return 404 when respondent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidRespondentUrl, { input });
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name', 'value']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['name', 'value', 'public'],
        {
          input: {
            name: false,
            value: ['array'],
            public: '0',
          },
        },
      );
    });

    it(`should return 403 when user custom fields disabled`, async () => {
      await survey.update({ userCustomFields: false });
      await suite.sharedTests.assertMissingAuthorization('post', url, { input });
    });

    it('should return 201 and new resource', async () => {
      await survey.update({ userCustomFields: true });
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate field name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], {
        input: { ...mocker.system.customField(), name: input.name },
      });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 201 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const output2 = mocker.system.customField();
      await suite.sharedTests.assertRecordInserted('post', url, output2, { input: output2 });
    });

    it('should return 201 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const output3 = mocker.system.customField();
      await suite.sharedTests.assertRecordInserted('post', url, output3, { input: output3 });
    });
  });
};
