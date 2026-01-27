import type { SurveySchemePromptCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveySchemePrompt } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-scheme-prompts';
  const permissions = ['survey-scheme-prompts', 'survey-scheme-prompts:read'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemePromptCreationAttributes;
  let output: SurveySchemePromptCreationAttributes;
  let schemePrompt: SurveySchemePrompt;

  beforeAll(async () => {
    input = mocker.system.surveySchemePrompt();
    schemePrompt = await SurveySchemePrompt.create(input);
    output = { ...input };

    url = `${baseUrl}/${schemePrompt.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
