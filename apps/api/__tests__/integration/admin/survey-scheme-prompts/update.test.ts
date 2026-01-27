import type { SurveySchemePromptCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveySchemePrompt } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-scheme-prompts';
  const permissions = ['survey-scheme-prompts', 'survey-scheme-prompts:edit'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemePromptCreationAttributes;
  let updateInput: SurveySchemePromptCreationAttributes;
  let schemePrompt: SurveySchemePrompt;

  beforeAll(async () => {
    input = mocker.system.surveySchemePrompt();
    updateInput = mocker.system.surveySchemePrompt();

    schemePrompt = await SurveySchemePrompt.create(input);

    url = `${baseUrl}/${schemePrompt.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['prompt']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['prompt.component'], {
        input: { prompt: { name: 'missingProps' } },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, updateInput, { input: updateInput });
    });
  });
};
