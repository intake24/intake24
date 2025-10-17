import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { addDollarSign } from '@intake24/api/util';
import type { QueueJob } from '@intake24/common/types';
import type {
  RecipeFoodRequest,
  RecipeFoodStepRequest,
  SplitListRequest,
  SplitWordRequest,
  SynonymSetRequest,
} from '@intake24/common/types/http/admin';
import {
  Op,
  RecipeFood,
  RecipeFoodStep,
  SplitList,
  SplitWord,
  SynonymSet,
  SystemLocale,
} from '@intake24/db';

function localeService({ scheduler, cache }: Pick<IoC, 'scheduler' | 'cache'>) {
  const resolveLocale = async (localeId: string | SystemLocale): Promise<SystemLocale> => {
    const locale
      = typeof localeId === 'string'
        ? await SystemLocale.findByPk(localeId, { attributes: ['id', 'code'] })
        : localeId;
    if (!locale)
      throw new NotFoundError();

    return locale;
  };
  const getSplitLists = async (localeId: string | SystemLocale) => {
    const { code } = await resolveLocale(localeId);

    return SplitList.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
  };

  const setSplitLists = async (
    localeId: string | SystemLocale,
    splitLists: SplitListRequest[],
  ) => {
    const { code } = await resolveLocale(localeId);

    const ids = splitLists.map(({ id }) => id) as string[];
    await SplitList.destroy({ where: { localeId: code, id: { [Op.notIn]: ids } } });

    if (!splitLists.length)
      return [];

    const records = await SplitList.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
    const newRecords: SplitList[] = [];

    for (const splitList of splitLists) {
      const { id, firstWord, words } = splitList;

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({ firstWord, words });
          continue;
        }
      }

      const newRecord = await SplitList.create({ localeId: code, firstWord, words });
      newRecords.push(newRecord);
    }

    return [...records, ...newRecords];
  };

  const getSplitWords = async (localeId: string | SystemLocale) => {
    const { code } = await resolveLocale(localeId);

    return SplitWord.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
  };

  const setSplitWords = async (
    localeId: string | SystemLocale,
    splitWords: SplitWordRequest[],
  ) => {
    const { code } = await resolveLocale(localeId);

    const ids = splitWords.map(({ id }) => id) as string[];
    await SplitWord.destroy({ where: { localeId: code, id: { [Op.notIn]: ids } } });

    if (!splitWords.length)
      return [];

    const records = await SplitWord.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
    const newRecords: SplitWord[] = [];

    for (const splitWord of splitWords) {
      const { id, words } = splitWord;

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({ words });
          continue;
        }
      }

      const newRecord = await SplitWord.create({ localeId: code, words });
      newRecords.push(newRecord);
    }

    return [...records, ...newRecords];
  };

  const getSynonymSets = async (localeId: string | SystemLocale) => {
    const { code } = await resolveLocale(localeId);

    return SynonymSet.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
  };

  const setSynonymSets = async (
    localeId: string | SystemLocale,
    synonymSets: SynonymSetRequest[],
  ) => {
    const { code } = await resolveLocale(localeId);

    const ids = synonymSets.map(({ id }) => id) as string[];
    await SynonymSet.destroy({ where: { localeId: code, id: { [Op.notIn]: ids } } });

    if (!synonymSets.length)
      return [];

    const records = await SynonymSet.findAll({ where: { localeId: code }, order: [['id', 'ASC']] });
    const newRecords: SynonymSet[] = [];

    for (const synonymSet of synonymSets) {
      const { id, synonyms } = synonymSet;

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({ synonyms });
          continue;
        }
      }

      const newRecord = await SynonymSet.create({ localeId: code, synonyms });
      newRecords.push(newRecord);
    }

    await cache.setAdd('locales-index', code);

    return [...records, ...newRecords];
  };

  // Get existing recipe foods for the specified Locale ID
  const getRecipeFoods = async (localeId: string | SystemLocale) => {
    const { code } = await resolveLocale(localeId);

    return RecipeFood.findAll({
      where: { localeId: code },
      include: [
        { association: 'steps' },
        { association: 'synonymSet' },
      ],
      order: [
        ['id', 'ASC'],
        [{ model: RecipeFoodStep, as: 'steps' }, 'order', 'ASC'],
      ],
    });
  };

  // Get existing recipe food steps for the specific recipe food for the specified Locale ID
  const getRecipeFoodSteps = async (
    localeId: string | SystemLocale,
    recipeFoodId: string,
  ): Promise<RecipeFoodStep[]> => {
    const { code } = await resolveLocale(localeId);

    return RecipeFoodStep.findAll({
      where: { localeId: code, recipeFoodsId: recipeFoodId },
      order: [['order', 'ASC']],
    });
  };

  // Add/modify/delete new or existing recipe foods for the specified Locale ID
  const setRecipeFoods = async (
    localeId: string | SystemLocale,
    recipeFoods: RecipeFoodRequest[],
  ) => {
    const { code: localeCode } = await resolveLocale(localeId);

    const ids = recipeFoods.map(({ id }) => id) as string[];
    await RecipeFood.destroy({ where: { localeId: localeCode, id: { [Op.notIn]: ids } } });

    if (!recipeFoods.length)
      return [];

    const records = await RecipeFood.findAll({
      where: { localeId: localeCode },
      order: [['id', 'ASC']],
    });
    const newRecords: RecipeFood[] = [];

    for (const recipeFood of recipeFoods) {
      const { id, code, name, recipeWord, synonymsId } = recipeFood;
      // To distinguish between the locale code and the special food code
      const recipeFoodCode = addDollarSign(code);

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({ code: recipeFoodCode, name, recipeWord, synonymsId });
          continue;
        }
      }

      const newRecord = await RecipeFood.create({
        localeId: localeCode,
        code: recipeFoodCode,
        name,
        recipeWord,
        synonymsId,
      });
      newRecords.push(newRecord);
    }
    await cache.setAdd('locales-index', localeCode);

    return [...records, ...newRecords];
  };

  // Add/modify/delete new or existing recipe food steps for the specific recipe food for the specified Locale ID
  const setRecipeFoodSteps = async (
    localeId: string | SystemLocale,
    recipeFoodId: string,
    recipeFoodSteps: RecipeFoodStepRequest[],
  ) => {
    const { code: localeCode } = await resolveLocale(localeId);
    const ids = recipeFoodSteps.map(({ id }) => id) as string[];
    await RecipeFoodStep.destroy({
      where: { localeId: localeCode, recipeFoodsId: recipeFoodId, id: { [Op.notIn]: ids } },
    });

    if (!recipeFoodSteps.length)
      return [];

    const records = await RecipeFoodStep.findAll({
      where: { localeId: localeCode, recipeFoodsId: recipeFoodId },
      order: [['order', 'ASC']],
    });
    const newRecords: RecipeFoodStep[] = [];

    for (const recipeFoodStep of recipeFoodSteps) {
      const { id, code, name, description, categoryCode, order, repeatable, required }
        = recipeFoodStep;

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({
            code,
            name,
            description,
            categoryCode,
            localeId: localeCode,
            order,
            repeatable,
            required,
          });
          continue;
        }
      }

      const newRecord = await RecipeFoodStep.create({
        localeId: localeCode,
        recipeFoodsId: recipeFoodId,
        code,
        name,
        description,
        categoryCode,
        order,
        repeatable,
        required: false,
      });
      newRecords.push(newRecord);
    }

    return [...records, ...newRecords];
  };

  /**
   * Queue locale tasks
   *
   * @param {QueueJob} input
   * @returns
   */
  const queueTask = async (input: QueueJob) => scheduler.jobs.addJob(input);

  return {
    getRecipeFoods,
    setRecipeFoods,
    getRecipeFoodSteps,
    setRecipeFoodSteps,
    getSplitLists,
    setSplitLists,
    getSplitWords,
    setSplitWords,
    getSynonymSets,
    setSynonymSets,
    queueTask,
  };
}

export default localeService;

export type LocaleService = ReturnType<typeof localeService>;
