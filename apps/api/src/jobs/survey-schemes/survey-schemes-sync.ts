import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Condition, SinglePrompt } from '@intake24/common/prompts';
import type { Meal, PromptSection, RecallPrompts } from '@intake24/common/surveys';

import { customPrompts, defaultAction, getConditionDefaults, portionSizePrompts, standardPrompts } from '@intake24/common/prompts';
import { defaultMeal, defaultSchemeSettings } from '@intake24/common/surveys';
import { merge } from '@intake24/common/util';
import { Survey, SurveyScheme } from '@intake24/db';

import BaseJob from '../job';
import promptMigrations from './migrations';

export default class SurveySchemesSync extends BaseJob<'SurveySchemesSync'> {
  readonly name = 'SurveySchemesSync';

  private readonly models;

  constructor({ models, logger }: Pick<IoC, 'models' | 'logger'>) {
    super({ logger });

    this.models = models;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveySchemesSync
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    await this.synchronizeSchemes();

    this.logger.debug('Job finished.');
  }

  private migratePrompt(prompt: { version: number }, section: PromptSection): { version: number } {
    let nextMigration = promptMigrations[prompt.version];

    while (nextMigration !== undefined) {
      prompt = nextMigration(prompt, section);
      nextMigration = promptMigrations[prompt.version];
    }

    return prompt;
  }

  /*
  Some type system abuse is going on here.

  The assumption is that the structure of the survey_schemes table is rarely going to change, but the structure
  of the JSON columns (prompts, meals, data_export) can change often. Currently this mainly applies to prompts.

  These fields are typed using the latest version of RecallPrompts, Meal and ExportSection types in the
  database model class, but since Sequelize doesn't actually do any data validation other than parsing
  the JSON contents, we can check the scheme version number and assume what the contents are.

  The migration functions return an update object that will bring the JSON columns to the next (not necessarily
  immediately the latest) version. Again, since all Sequelize model does is JSON.stringify, we can feed it
  intermediate data that does not match the latest type, as long as we write the correct type in the end.
  */
  private async migrateSchemePrompts(scheme: SurveyScheme): Promise<void> {
    const prompts: RecallPrompts = {
      preMeals: scheme.prompts.preMeals.map(prompt => this.migratePrompt(prompt, 'preMeals') as unknown as SinglePrompt),
      meals: {
        preFoods: scheme.prompts.meals.preFoods.map(prompt => this.migratePrompt(prompt, 'preFoods') as unknown as SinglePrompt),
        foods: scheme.prompts.meals.foods.map(prompt => this.migratePrompt(prompt, 'foods') as unknown as SinglePrompt),
        postFoods: scheme.prompts.meals.postFoods.map(prompt => this.migratePrompt(prompt, 'postFoods') as unknown as SinglePrompt),
        foodsDeferred: scheme.prompts.meals.foodsDeferred ? scheme.prompts.meals.foodsDeferred.map(prompt => this.migratePrompt(prompt, 'foodsDeferred') as unknown as SinglePrompt) : [],
      },
      postMeals: scheme.prompts.postMeals.map(prompt => this.migratePrompt(prompt, 'postMeals') as unknown as SinglePrompt),
      submission: scheme.prompts.submission.map(prompt => this.migratePrompt(prompt, 'submission') as unknown as SinglePrompt),
    };

    scheme.prompts = prompts;

    await scheme.save({ fields: ['prompts'] });
  }

  private async migrateSchemeOverridePrompts(survey: Survey): Promise<void> {
    // Override prompts have no section context, but this value is only used to decide some default values
    // by the migration functions
    const prompts = survey.surveySchemeOverrides.prompts.map(prompt => this.migratePrompt(prompt, 'preMeals') as unknown as SinglePrompt);
    survey.surveySchemeOverrides = {
      ...survey.surveySchemeOverrides,
      prompts,
    };

    await survey.save({ fields: ['surveySchemeOverrides'] });
  }

  private getPromptMap() {
    return [...customPrompts, ...standardPrompts, ...portionSizePrompts].reduce<
      Record<string, SinglePrompt>
    >((acc, prompt) => {
      acc[prompt.component] = prompt;
      return acc;
    }, {});
  }

  private async synchronizeSchemes(): Promise<void> {
    this.logger.debug(`Synchronization of survey schemes started.`);

    const promptMap = this.getPromptMap();

    const promptMergeCallback = (prompt: SinglePrompt) => {
      const { component, type, ...rest } = prompt;
      const { actions, conditions, ...baseMerge } = merge<SinglePrompt>(promptMap[prompt.component], rest);
      return {
        ...baseMerge,
        actions: actions
          ? {
              ...actions,
              items: actions.items.map(action => merge(defaultAction, action)),
            }
          : undefined,
        conditions: conditions.map(condition => merge<Condition>(getConditionDefaults(condition.object, condition.property.id), condition)),
      };
    };

    const mealMergeCallback = (meal: Meal) => merge(defaultMeal, meal);

    const schemes = await this.models.system.SurveyScheme.findAll({
      attributes: ['id', 'meals', 'prompts', 'settings'],
      order: [['id', 'ASC']],
    });

    for (const scheme of schemes) {
      await this.migrateSchemePrompts(scheme);

      const meals = scheme.meals.map(mealMergeCallback);

      const prompts: RecallPrompts = {
        preMeals: scheme.prompts.preMeals.map(promptMergeCallback),
        meals: {
          preFoods: scheme.prompts.meals.preFoods.map(promptMergeCallback),
          foods: scheme.prompts.meals.foods.map(promptMergeCallback),
          postFoods: scheme.prompts.meals.postFoods.map(promptMergeCallback),
          foodsDeferred: scheme.prompts.meals.foodsDeferred ? scheme.prompts.meals.foodsDeferred.map(promptMergeCallback) : [],
        },
        postMeals: scheme.prompts.postMeals.map(promptMergeCallback),
        submission: scheme.prompts.submission.map(promptMergeCallback),
      };
      const settings = merge(defaultSchemeSettings, scheme.settings);

      await scheme.update({ meals, prompts, settings });
    }

    const surveys = await this.models.system.Survey.findAll({
      attributes: ['id', 'surveySchemeOverrides'],
      order: [['id', 'ASC']],
    });

    for (const survey of surveys) {
      await this.migrateSchemeOverridePrompts(survey);

      await survey.update({
        surveySchemeOverrides: {
          meals: survey.surveySchemeOverrides.meals.map(mealMergeCallback),
          prompts: survey.surveySchemeOverrides.prompts.map(promptMergeCallback),
          settings: survey.surveySchemeOverrides.settings ?? {},
        },
      });
    }

    this.logger.debug(`Synchronization of survey schemes finished.`);
  }
}
