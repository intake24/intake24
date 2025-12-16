import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { ExternalSource } from '@intake24/common/prompts';
import type {
  CustomData,
  EncodedFood,
  ExternalSourceRecord,
  FoodState,
  MealState,
  MissingFood,
  RecipeBuilder,
  SurveyState,
} from '@intake24/common/surveys';
import type {
  Dictionary,
  WithKey,
} from '@intake24/common/types';
import type { SurveySubmissionResponse } from '@intake24/common/types/http';
import type {
  SurveySubmissionExternalSourceCreationAttributes,
  SurveySubmissionFoodCreationAttributes,
  SurveySubmissionMissingFoodCreationAttributes,
} from '@intake24/db';
import {
  Food,
  Survey,
  SurveySubmission,
  SurveySubmissionExternalSource,
  SurveySubmissionFood,
  SurveySubmissionMeal,
  SurveySubmissionMissingFood,
} from '@intake24/db';

export type FoodMap = Record<string, Food>;

export type CustomAnswers<K extends string | number | symbol> = WithKey<K> & {
  id: string;
  name: string;
  value: string;
};

export type CollectFoodsOps = {
  foods: FoodMap;
  mealId: string;
  parentId?: string;
  foodCustomPrompts: string[];
};

export type CollectedFoods = {
  inputs: SurveySubmissionFoodCreationAttributes[];
  states: (EncodedFood | RecipeBuilder)[];
  missingInputs: SurveySubmissionMissingFoodCreationAttributes[];
  missingStates: MissingFood[];
};

export type CollectedNutrientInfo = {
  nutrients: Dictionary;
  fields: Dictionary;
  portionSize: Dictionary;
};

export type FoodCodes = { foodCodes: string[] };

function surveySubmissionService({
  cache,
  db,
  logger: globalLogger,
  scheduler,
  popularityCountersService,
  surveyService,
}: Pick<IoC, 'cache' | 'db' | 'logger' | 'scheduler' | 'popularityCountersService' | 'surveyService'>) {
  const logger = globalLogger.child({ service: 'SurveySubmissionsService' });

  /**
   * Collect custom prompt answers as custom fields
   *
   * @param {CustomData} promptAnswers
   * @param {string[]} prompts
   * @returns {Dictionary}
   */
  const collectCustomAnswers = (
    promptAnswers: CustomData,
    prompts: string[],
  ): CustomData => {
    return Object.entries(promptAnswers)
      .filter(([name]) => prompts.includes(name))
      .reduce<CustomData>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  };

  /**
   * Collect food codes from submission state
   *
   * @param {string[]} codes
   * @param {FoodState | MealState} entity
   * @returns {string[]}
   *
   */
  const collectFoodCodes = (codes: string[], entity: MealState | FoodState): string[] => {
    if ('foods' in entity) {
      entity.foods.reduce(collectFoodCodes, codes);
      return codes;
    }

    const { linkedFoods, type } = entity;
    if (type === 'free-text') {
      logger.warn(`Submission: ${type} food record present in 'collectFoodCodes, skipping...`);
      return codes;
    }

    if (type === 'encoded-food') {
      codes.push(entity.data.code);
    }

    if (linkedFoods.length) {
      linkedFoods.reduce(collectFoodCodes, codes);
    }

    return codes;
  };

  const collectFoodCompositionData = (
    foodState: EncodedFood,
    foods: FoodMap,
  ) => {
    const collectedData: CollectedNutrientInfo = { fields: {}, nutrients: {}, portionSize: {} };

    const {
      portionSize,
      data: { code },
    } = foodState;

    const foodRecord = foods[code];

    if (!foodRecord) {
      logger.warn(`Submission: food code not found (${code}), skipping...`);
      return collectedData;
    }

    if (!foodRecord.nutrientRecords)
      throw new Error('Submission: not loaded foodRecord relationships');

    if (!portionSize) {
      logger.warn(`Submission: Missing portion size data for food code (${code}), skipping...`);
      return collectedData;
    }

    // Collect portion sizes data
    collectedData.portionSize = portionSize;

    // Bail if no nutrient record links - missing encoded food link
    if (!foodRecord.nutrientRecords.length) {
      logger.warn(`Submission: Missing nutrient mapping for food code (${code}), skipping...`);
      return collectedData;
    }

    const [nutrientTableRecord] = foodRecord.nutrientRecords;
    if (!nutrientTableRecord.nutrients || !nutrientTableRecord.fields)
      throw new Error('Submission: not loaded nutrient relationships');

    // Collect food composition fields
    collectedData.fields = nutrientTableRecord.fields.reduce<Dictionary>((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {});

    // Collect food composition nutrients
    const portionSizeWeight = (portionSize.servingWeight ?? 0) - (portionSize.leftoversWeight ?? 0);

    collectedData.nutrients = nutrientTableRecord.nutrients.reduce<Dictionary>(
      (acc, { nutrientTypeId, unitsPer100g }) => {
        acc[nutrientTypeId] = (unitsPer100g * portionSizeWeight) / 100.0;
        return acc;
      },
      {},
    );

    return collectedData;
  };

  /**
   * Collect foods from submissions state
   *
   * @param {CollectFoodsOps} ops
   */
  const collectFoods
    = (ops: CollectFoodsOps) =>
      (collectedFoods: CollectedFoods, foodState: FoodState): CollectedFoods => {
        const { foods, mealId, parentId, foodCustomPrompts } = ops;

        if (foodState.type === 'free-text') {
          logger.warn(`Submission: ${foodState.type} food record present in submission, skipping...`);
          return collectedFoods;
        }

        if (foodState.type === 'missing-food') {
          const { info } = foodState;
          if (!info) {
            logger.warn(`Submission: ${foodState.type} without info, skipping...`);
            return collectedFoods;
          }

          collectedFoods.missingInputs.push({
            ...info,
            id: randomUUID(),
            parentId,
            mealId,
            index: collectedFoods.inputs.length + collectedFoods.missingInputs.length,
          });
          collectedFoods.missingStates.push(foodState);

          return collectedFoods;
        }

        if (foodState.type === 'recipe-builder') {
          const { linkedFoods, searchTerm, template, customPromptAnswers } = foodState;

          const id = randomUUID();

          collectedFoods.inputs.push({
            id,
            parentId,
            mealId,
            index: collectedFoods.inputs.length + collectedFoods.missingInputs.length,
            code: template.code,
            englishName: template.name,
            localName: template.name,
            locale: template.localeId,
            readyMeal: false,
            searchTerm: (searchTerm ?? '').slice(0, 256),
            portionSizeMethodId: 'recipe-builder',
            reasonableAmount: true,
            brand: null,
            barcode: null,
            nutrientTableId: '',
            nutrientTableCode: '',
            customData: collectCustomAnswers(customPromptAnswers, foodCustomPrompts),
          });
          collectedFoods.states.push(foodState);

          return linkedFoods.reduce(
            collectFoods({ foods, mealId, parentId: id, foodCustomPrompts }),
            collectedFoods,
          );
        }

        const {
          data: { code, reasonableAmount },
          flags,
          linkedFoods,
          portionSize,
          searchTerm,
          customPromptAnswers,
        } = foodState;

        const foodRecord = foods[code];

        if (!foodRecord) {
          logger.warn(`Submission: food '${code}' not found, skipping...`);
          return collectedFoods;
        }

        if (!foodRecord.nutrientRecords)
          throw new Error('Submission: not loaded foodRecord relationships');

        const {
          nutrientRecords,
          name,
          englishName,
          localeId,
        } = foodRecord;

        if (!portionSize) {
          logger.warn(`Submission: Missing portion size data for food code (${code}), skipping...`);
          return collectedFoods;
        }

        const portionSizeWeight
          = (portionSize.servingWeight ?? 0) - (portionSize.leftoversWeight ?? 0);
        const id = randomUUID();

        collectedFoods.inputs.push({
          id,
          parentId,
          mealId,
          index: collectedFoods.inputs.length + collectedFoods.missingInputs.length,
          code,
          englishName,
          localName: name,
          locale: localeId,
          readyMeal: flags.includes('ready-meal'),
          searchTerm: (searchTerm ?? '').slice(0, 256),
          portionSizeMethodId: portionSize.method,
          reasonableAmount: reasonableAmount >= portionSizeWeight,
          brand: null,
          barcode: null,
          nutrientTableId: nutrientRecords[0]?.nutrientTableId ?? '0',
          nutrientTableCode: nutrientRecords[0]?.nutrientTableRecordId ?? '0',
          customData: collectCustomAnswers(customPromptAnswers, foodCustomPrompts),
          ...collectFoodCompositionData(foodState, foods),
        });
        collectedFoods.states.push(foodState);

        return linkedFoods.reduce(
          collectFoods({ foods, mealId, parentId: id, foodCustomPrompts }),
          collectedFoods,
        );
      };

  const collectExternalSources = (
    foodId: string,
    foodType: 'food' | 'missing-food',
    externalSources?: ExternalSourceRecord,
  ) => {
    if (!externalSources)
      return [];

    const externalSourcesData: SurveySubmissionExternalSourceCreationAttributes[] = [];

    for (const [source, info] of Object.entries(externalSources)) {
      externalSourcesData.push({
        id: randomUUID(),
        foodId,
        foodType,
        source: source as ExternalSource,
        ...info,
      });
    }

    return externalSourcesData;
  };

  /**
   * Submit recall
   *
   * @param {string} slug
   * @param {string} userId
   * @param {SurveyState} surveyState
   * @param {number} tzOffset
   * @returns {Promise<SurveySubmissionResponse>}
   */
  const submit = async (
    slug: string,
    userId: string,
    surveyState: SurveyState,
    tzOffset: number,
  ): Promise<SurveySubmissionResponse> => {
    const survey = await Survey.findBySlug(slug, {
      attributes: [
        'id',
        'feedbackSchemeId',
        'maximumTotalSubmissions',
        'maximumDailySubmissions',
        'notifications',
        'numberOfSubmissionsForFeedback',
        'session',
      ],
      include: [{ association: 'surveyScheme', attributes: ['prompts'], required: true }],
    });
    if (!survey)
      throw new NotFoundError();

    const { id: surveyId } = survey;
    const submission = { id: randomUUID(), submissionTime: new Date() };
    const state = { ...surveyState, ...submission };

    const [userInfo, followUpUrl] = await Promise.all([
      surveyService.userInfo(survey, userId, tzOffset, 1),
      surveyService.getFollowUpUrl(survey, userId),
      scheduler.jobs.addJob({ type: 'SurveySubmission', userId, params: { surveyId, userId, state } }),
      survey.session.store ? surveyService.saveSession(survey, userId, state) : () => Promise.resolve(),
    ]);

    return { ...userInfo, followUpUrl, submission };
  };

  /**
   * Process survey submission
   *
   * @param {string} surveyId
   * @param {string} userId
   * @param {SurveyState} state
   * @returns {Promise<void>}
   */
  const processSubmission = async (
    surveyId: string,
    userId: string,
    state: SurveyState,
  ): Promise<void> => {
    const { uxSessionId: sessionId } = state;

    const [survey, submission] = await Promise.all([
      Survey.findOne({
        attributes: ['id', 'notifications', 'searchSettings'],
        where: { id: surveyId },
        include: [
          { association: 'locale', attributes: ['id', 'code'], required: true },
          { association: 'surveyScheme', attributes: ['id', 'prompts'], required: true },
        ],
      }),
      SurveySubmission.findOne({ attributes: ['id'], where: { surveyId, userId, sessionId } }),
    ]);
    if (!survey || !survey.locale || !survey.surveyScheme)
      throw new NotFoundError();

    if (submission) {
      throw new Error(
        `Duplicate submission for surveyId: ${surveyId}, userId: ${userId}, sessionId: ${sessionId}`,
      );
    }

    const {
      locale: { code: localeCode },
      surveyScheme: {
        prompts: {
          preMeals,
          postMeals,
          meals: { foods, preFoods, postFoods },
        },
      },
      notifications,
      searchSettings: {
        collectData: searchCollectData,
      },
    } = survey;

    const submissionCustomPrompts = [...preMeals, ...postMeals]
      .filter(({ type }) => type === 'custom')
      .map(({ id }) => id);

    const mealCustomPrompts = [...preFoods, ...postFoods]
      .filter(({ type }) => type === 'custom')
      .map(({ id }) => id);

    const foodCustomPrompts = [
      ...foods.filter(({ type }) => type === 'custom').map(({ id }) => id),
      ...[...preMeals, ...postMeals].filter(({ component, type }) => type === 'custom' && component === 'aggregate-choice-prompt').map(({ id }) => id),
    ];

    await db.system.transaction(async (transaction) => {
      const { recallDate, startTime, endTime, userAgent, wakeUpTime, sleepTime } = state;
      const submissionTime = state.submissionTime ?? new Date();
      const id = state.id ?? randomUUID();

      if (!startTime || !endTime) {
        logger.warn('Submission: missing startTime / endTime on submission state.', {
          surveyId,
          userId,
          submissionTime,
        });
      }

      // Survey submission
      const { id: surveySubmissionId } = await SurveySubmission.create(
        {
          id,
          surveyId,
          userId,
          recallDate,
          startTime: startTime ?? submissionTime,
          endTime: endTime ?? submissionTime,
          submissionTime,
          sessionId,
          userAgent,
          wakeUpTime,
          sleepTime,
          customData: collectCustomAnswers(state.customPromptAnswers, submissionCustomPrompts),
        },
        { transaction },
      );

      // Collect meals
      const mealInputs = state.meals.map(({ name: { en: name }, time, duration, customPromptAnswers }) => ({
        id: randomUUID(),
        surveySubmissionId,
        name,
        hours: time?.hours ?? 0,
        minutes: time?.minutes ?? 0,
        duration,
        customData: collectCustomAnswers(customPromptAnswers, mealCustomPrompts),
      }));

      // Store meals
      await SurveySubmissionMeal.bulkCreate(mealInputs, { transaction });

      const foodCodes = state.meals.reduce(collectFoodCodes, []);

      const foodRecords = await Food.findAll({
        where: { code: foodCodes, localeId: localeCode },
        include: [
          {
            association: 'nutrientRecords',
            through: { attributes: [] },
            include: [{ association: 'fields' }, { association: 'nutrients' }],
          },
        ],
      });

      const foodMap = foodRecords.reduce<Record<string, Food>>((acc, item) => {
        acc[item.code] = item;
        return acc;
      }, {});

      const foodInputs: SurveySubmissionFoodCreationAttributes[] = [];
      const missingFoodInputs: SurveySubmissionMissingFoodCreationAttributes[] = [];
      const externalSourcesInputs: SurveySubmissionExternalSourceCreationAttributes[] = [];

      // Process meals
      for (const [idx, mealState] of state.meals.entries()) {
        const { id: mealId } = mealInputs[idx];

        // Collect meal foods
        const collectedFoods = mealState.foods.reduce(
          collectFoods({ foods: foodMap, mealId, foodCustomPrompts }),
          {
            inputs: [],
            states: [],
            missingInputs: [],
            missingStates: [],
          },
        );

        foodInputs.push(...collectedFoods.inputs);
        missingFoodInputs.push(...collectedFoods.missingInputs);

        // Process foods
        for (const [idx, foodState] of collectedFoods.states.entries()) {
          const { id: foodId } = collectedFoods.inputs[idx];

          externalSourcesInputs.push(...collectExternalSources(foodId, 'food', foodState.external));
        }

        // Process missing foods
        for (const [idx, foodState] of collectedFoods.missingStates.entries()) {
          const { id: foodId } = collectedFoods.missingInputs[idx];

          externalSourcesInputs.push(...collectExternalSources(foodId, 'missing-food', foodState.external));
        }
      }

      // Store foods & missing foods
      await Promise.all([
        SurveySubmissionFood.bulkCreate(foodInputs, { transaction }),
        SurveySubmissionMissingFood.bulkCreate(missingFoodInputs, { transaction }),
      ]);

      if (externalSourcesInputs.length)
        await SurveySubmissionExternalSource.bulkCreate(externalSourcesInputs, { transaction });

      const promises: Promise<unknown>[] = [
        cache.forget(`user-submissions:${userId}`),
      ];

      if (searchCollectData) {
        promises.push(
          popularityCountersService.updateGlobalCounters(foodCodes),
          popularityCountersService.updateLocalCounters(localeCode, foodCodes),
        );
      }

      if (notifications.length && notifications.some(({ type }) => type === 'survey.session.submitted')) {
        promises.push(scheduler.jobs.addJob({
          type: 'SurveyEventNotification',
          userId,
          params: {
            type: 'survey.session.submitted',
            sessionId,
            surveyId,
            submissionId: surveySubmissionId,
            userId,
          },
        }));
      }

      await Promise.all(promises);
    });
  };

  return { processSubmission, submit };
}

export default surveySubmissionService;

export type SurveySubmissionService = ReturnType<typeof surveySubmissionService>;
