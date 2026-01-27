import type { SurveySchemePromptCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/survey-scheme-prompts';
  const permissions = ['survey-scheme-prompts', 'survey-scheme-prompts:create'];

  let input: SurveySchemePromptCreationAttributes;
  let output: SurveySchemePromptCreationAttributes;

  beforeAll(async () => {
    input = mocker.system.surveySchemePrompt();
    output = { ...input };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['prompt']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['prompt.component'], {
        input: { prompt: { name: 'missingProps' } },
      });
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate promptId', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['prompt'], {
        input: {
          ...mocker.system.surveySchemePrompt().prompt,
          id: input.prompt.id,
        },
      });
    });
  });
};
