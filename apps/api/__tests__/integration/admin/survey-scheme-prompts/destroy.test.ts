import type { SurveySchemePromptCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveySchemePrompt } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-scheme-prompts';
  const permissions = ['survey-scheme-prompts', 'survey-scheme-prompts:delete'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemePromptCreationAttributes;
  let schemePrompt: SurveySchemePrompt;

  beforeAll(async () => {
    input = mocker.system.surveySchemePrompt();
    schemePrompt = await SurveySchemePrompt.create(input);

    url = `${baseUrl}/${schemePrompt.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });
};
