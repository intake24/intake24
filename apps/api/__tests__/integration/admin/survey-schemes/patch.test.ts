import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { SurveySchemeCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:edit'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemeCreationAttributes;
  let updateInput: SurveySchemeCreationAttributes;
  let scheme: SurveyScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.surveyScheme();
    updateInput = mocker.system.surveyScheme();
    scheme = await SurveyScheme.create(input);

    securable = { securableId: scheme.id, securableType: 'SurveyScheme' };

    url = `${baseUrl}/${scheme.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('patch', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('patch', url, []);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'patch',
        url,
        [
          'name',
          'settings.type',
          'settings.flow',
          'settings.recallDate',
          'settings.languages',
          'settings.help.available.0',
          'settings.help.required',
          'visibility',
          'meals',
          'prompts',
          'dataExport',
        ],
        {
          input: {
            name: [],
            settings: {
              type: false,
              flow: '10-pass',
              recallDate: '2022-01-01',
              languages: 0,
              help: {
                available: ['not-valid'],
                required: 10,
              },
            },
            visibility: { one: 'two' },
            meals: 10,
            prompts: 'invalidPrompts',
            dataExport: 5,
          },
        },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['survey-schemes']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['edit'] });
      const updateInput2 = mocker.system.surveyScheme();

      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput2);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await scheme.update({ ownerId: suite.data.system.user.id });

      const updateInput3 = mocker.system.surveyScheme();

      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput3);
    });
  });
};
