import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { isMealSection } from '@intake24/common/surveys';
import {
  SurveyScheme,
  SurveySchemePrompt,
} from '@intake24/db';

async function uniqueMiddleware(value: any, { surveySchemePromptId }: { surveySchemePromptId?: string } = {}) {
  const where: WhereOptions = surveySchemePromptId ? { id: { [Op.ne]: surveySchemePromptId } } : {};

  const prompts = await SurveySchemePrompt.findAll({
    attributes: ['id', 'prompt'],
    where,
  });
  const match = prompts.find(p => p.prompt.id === value.id);
  if (match) {
    throw ValidationError.from({ path: 'prompt', i18n: { type: 'unique._' } });
  }
}

export function surveySchemePrompt() {
  return initServer().router(contract.admin.surveySchemePrompt, {
    browse: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:browse')],
      handler: async ({ query }) => {
        const schemePrompts = await SurveySchemePrompt.paginate({
          query,
          columns: ['promptId', 'name'],
          order: [[fn('lower', col('prompt_id')), 'ASC']],
        });

        return { status: 200, body: schemePrompts };
      },
    },
    store: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:create')],
      handler: async ({ body }) => {
        const { prompt } = body;

        await uniqueMiddleware(prompt);

        const { id: promptId, name } = prompt;
        const schemePrompt = await SurveySchemePrompt.create({ promptId, name, prompt });

        return { status: 201, body: schemePrompt };
      },
    },
    refs: {
      middleware: [permission('survey-scheme-prompts')],
      handler: async () => {
        const [schemes, prompts] = await Promise.all([
          SurveyScheme.findAll(),
          SurveySchemePrompt.findAll({ attributes: ['prompt'] }),
        ]);

        const promptIds = prompts.map(p => p.prompt.id);

        return { status: 200, body: { promptIds, schemes } };
      },
    },
    read: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:read')],
      handler: async ({ params: { surveySchemePromptId } }) => {
        const schemePrompt = await SurveySchemePrompt.findByPk(surveySchemePromptId);
        if (!schemePrompt)
          throw new NotFoundError();

        return { status: 200, body: schemePrompt };
      },
    },
    update: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:edit')],
      handler: async ({ body, params: { surveySchemePromptId } }) => {
        const { prompt } = body;

        await uniqueMiddleware(prompt, { surveySchemePromptId });

        const { id: promptId, name } = prompt;
        const schemePrompt = await SurveySchemePrompt.findByPk(surveySchemePromptId);
        if (!schemePrompt)
          throw new NotFoundError();

        await schemePrompt.update({ promptId, name, prompt });

        return { status: 200, body: schemePrompt };
      },
    },
    destroy: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:delete')],
      handler: async ({ params: { surveySchemePromptId } }) => {
        const schemePrompt = await SurveySchemePrompt.findByPk(surveySchemePromptId, {
          attributes: ['id'],
        });
        if (!schemePrompt)
          throw new NotFoundError();

        await schemePrompt.destroy();

        return { status: 204, body: undefined };
      },
    },
    sync: {
      middleware: [permission('survey-scheme-prompts', 'survey-scheme-prompts:sync')],
      handler: async ({ body, params: { surveySchemePromptId } }) => {
        const { prompt, section, surveySchemeId } = body;

        const schemePrompt = await SurveySchemePrompt.findByPk(surveySchemePromptId, {
          attributes: ['id'],
        });
        if (!schemePrompt)
          throw new NotFoundError();

        const scheme = await SurveyScheme.findByPk(surveySchemeId, { attributes: ['id', 'prompts'] });
        if (!scheme)
          throw new NotFoundError();

        const { prompts } = scheme;
        const sectionPrompts = isMealSection(section) ? prompts.meals[section] : prompts[section];

        const match = sectionPrompts.findIndex(p => p.id === prompt.id);
        if (match === -1)
          throw new NotFoundError();

        sectionPrompts.splice(match, 1, prompt);

        if (isMealSection(section))
          prompts.meals[section] = sectionPrompts;
        else prompts[section] = sectionPrompts;

        await scheme.update({ prompts });

        return { status: 200, body: undefined };
      },
    },
  });
}
