import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type {
  SurveySchemeCreationAttributes,
  SurveySchemePromptCreationAttributes,
} from '@intake24/db';
import { SurveyScheme, SurveySchemePrompt } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-scheme-prompts';
  const permissions = ['survey-scheme-prompts', 'survey-scheme-prompts:sync'];

  let url: string;
  let invalidUrl: string;

  let schemeInput: SurveySchemeCreationAttributes;
  let schemePromptInput: SurveySchemePromptCreationAttributes;
  let syncInput: any;

  let scheme: SurveyScheme;
  let schemePrompt: SurveySchemePrompt;

  beforeAll(async () => {
    schemeInput = mocker.system.surveyScheme();
    schemePromptInput = mocker.system.surveySchemePrompt();

    schemeInput = {
      ...schemeInput,
      prompts: {
        ...schemeInput.prompts,
        preMeals: [schemePromptInput.prompt],
      },
    };

    schemePrompt = await SurveySchemePrompt.create(schemePromptInput);
    scheme = await SurveyScheme.create(schemeInput);

    syncInput = {
      surveySchemeId: scheme.id,
      section: 'preMeals',
      prompt: {
        ...mocker.system.surveySchemePrompt().prompt,
        id: schemePromptInput.prompt.id,
      },
    };

    url = `${baseUrl}/${schemePrompt.id}/sync`;
    invalidUrl = `${baseUrl}/999999/sync`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, [
        'surveySchemeId',
        'section',
        'prompt',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['surveySchemeId', 'section', 'prompt.component'],
        {
          input: {
            surveySchemeId: ['123456'],
            section: 'notValidSchemeSection',
            prompt: { name: 'missingProps' },
          },
        },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, { input: syncInput });
    });

    it(`should return 404 when scheme record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, {
        input: { ...syncInput, surveySchemeId: '987654' },
      });
    });

    it(`should return 404 when prompt is not in correct section`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, {
        input: { ...syncInput, section: 'postMeals' },
      });
    });

    it(`should return 404 when prompt ID is not found in scheme prompts set`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, {
        input: { ...syncInput, prompt: { ...syncInput.prompt, id: 'invalidPromptId' } },
      });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertAcknowledged('post', url, { input: syncInput });
    });
  });
};
