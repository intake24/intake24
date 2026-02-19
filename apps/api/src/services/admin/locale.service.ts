import type { Kysely } from 'kysely';

import type { IoC } from '@intake24/api/ioc';
import type { QueueJob } from '@intake24/common/types';
import type {
  FoodBuilderRequest,
  LocaleRequest,
  SplitListRequest,
  SplitWordRequest,
  SynonymSetRequest,
} from '@intake24/common/types/http/admin';
import type { FoodsDB, OnConflictOption, SystemDB } from '@intake24/db';

import { Op } from 'sequelize';

import { ConflictError, NotFoundError } from '@intake24/api/http/errors';
import { addDollarSign } from '@intake24/api/util';
import { FoodBuilder, SplitList, SplitWord, SynonymSet, SystemLocale } from '@intake24/db';

function localeService({ scheduler, cache, kyselyDb }: Pick<IoC, 'scheduler' | 'cache' | 'kyselyDb'>) {
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

  // Get existing food builders for the specified Locale ID
  const getFoodBuilders = async (localeId: string | SystemLocale) => {
    const { code } = await resolveLocale(localeId);

    return FoodBuilder.findAll({
      where: { localeId: code },
      include: [{ association: 'synonymSet' }],
      order: [['id', 'ASC']],
    });
  };

  // Add/modify/delete new or existing food builders for the specified Locale ID
  const setFoodBuilders = async (localeId: string | SystemLocale, foodBuilders: FoodBuilderRequest[]) => {
    const { code: localeCode } = await resolveLocale(localeId);

    const ids = foodBuilders.map(({ id }) => id) as string[];
    await FoodBuilder.destroy({ where: { localeId: localeCode, id: { [Op.notIn]: ids } } });

    if (!foodBuilders.length)
      return [];

    const records = await FoodBuilder.findAll({
      where: { localeId: localeCode },
      order: [['id', 'ASC']],
    });
    const newRecords: FoodBuilder[] = [];

    for (const foodBuilder of foodBuilders) {
      const { id, ...rest } = foodBuilder;
      // To distinguish between the locale code and the special food code
      const builderCode = addDollarSign(rest.code);

      if (id) {
        const match = records.find(record => record.id === id);
        if (match) {
          await match.update({ ...rest, code: builderCode });
          continue;
        }
      }

      const newRecord = await FoodBuilder.create({
        ...rest,
        code: builderCode,
        localeId: localeCode,
      });
      newRecords.push(newRecord);
    }
    await cache.setAdd('locales-index', localeCode);

    return [...records, ...newRecords];
  };

  const bulkUpdateLocales = async (
    input: LocaleRequest[],
    onConflict: OnConflictOption,
    foodsTransaction?: Kysely<FoodsDB>,
    systemTransaction?: Kysely<SystemDB>,
  ) => {
    if (input.length === 0)
      return;

    const foodsImpl = async (transaction: Kysely<FoodsDB>) => {
      const values = input.map(locale => ({
        id: locale.code,
        englishName: locale.englishName,
        localName: locale.localName,
        respondentLanguageId: locale.respondentLanguageId,
        adminLanguageId: locale.adminLanguageId,
        countryFlagCode: locale.countryFlagCode,
        textDirection: locale.textDirection,
        foodIndexEnabled: locale.foodIndexEnabled,
        foodIndexLanguageBackendId: locale.foodIndexLanguageBackendId,
      }));

      switch (onConflict) {
        case 'overwrite': {
          await transaction
            .insertInto('locales')
            .values(values)
            .onConflict(oc => oc
              .column('id')
              .doUpdateSet({
                englishName: eb => eb.ref('excluded.englishName'),
                localName: eb => eb.ref('excluded.localName'),
                respondentLanguageId: eb => eb.ref('excluded.respondentLanguageId'),
                adminLanguageId: eb => eb.ref('excluded.adminLanguageId'),
                countryFlagCode: eb => eb.ref('excluded.countryFlagCode'),
                textDirection: eb => eb.ref('excluded.textDirection'),
                foodIndexEnabled: eb => eb.ref('excluded.foodIndexEnabled'),
                foodIndexLanguageBackendId: eb => eb.ref('excluded.foodIndexLanguageBackendId'),
              }),
            )
            .execute();
          break;
        }

        case 'skip': {
          await transaction
            .insertInto('locales')
            .values(values)
            .onConflict(oc => oc
              .column('id')
              .doNothing(),
            )
            .execute();
          break;
        }

        case 'abort': {
          const codes = input.map(c => c.code);
          const existingLocales = await transaction
            .selectFrom('locales')
            .select(['id'])
            .where('id', 'in', codes)
            .execute();

          if (existingLocales.length > 0) {
            const conflictingCodes = existingLocales.map(c => c.id);
            throw new ConflictError(`Locale codes already exist in foods database: ${conflictingCodes.join(', ')}`);
          }

          await transaction
            .insertInto('locales')
            .values(values)
            .returning(['id'])
            .execute();
          break;
        }
      }
    };

    const systemImpl = async (transaction: Kysely<SystemDB>) => {
      const values = input.map(locale => ({
        code: locale.code,
        englishName: locale.englishName,
        localName: locale.localName,
        respondentLanguageId: locale.respondentLanguageId,
        adminLanguageId: locale.adminLanguageId,
        countryFlagCode: locale.countryFlagCode,
        textDirection: locale.textDirection,
        foodIndexEnabled: locale.foodIndexEnabled,
        foodIndexLanguageBackendId: locale.foodIndexLanguageBackendId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      switch (onConflict) {
        case 'overwrite': {
          await transaction
            .insertInto('locales')
            .values(values)
            .onConflict(oc => oc
              .column('code')
              .doUpdateSet({
                englishName: eb => eb.ref('excluded.englishName'),
                localName: eb => eb.ref('excluded.localName'),
                respondentLanguageId: eb => eb.ref('excluded.respondentLanguageId'),
                adminLanguageId: eb => eb.ref('excluded.adminLanguageId'),
                countryFlagCode: eb => eb.ref('excluded.countryFlagCode'),
                textDirection: eb => eb.ref('excluded.textDirection'),
                foodIndexEnabled: eb => eb.ref('excluded.foodIndexEnabled'),
                foodIndexLanguageBackendId: eb => eb.ref('excluded.foodIndexLanguageBackendId'),
                updatedAt: eb => eb.ref('excluded.updatedAt'),
              }),
            )
            .execute();
          break;
        }

        case 'skip': {
          await transaction
            .insertInto('locales')
            .values(values)
            .onConflict(oc => oc
              .column('code')
              .doNothing(),
            )
            .execute();
          break;
        }

        case 'abort': {
          const codes = input.map(c => c.code);
          const existingLocales = await transaction
            .selectFrom('locales')
            .select(['code'])
            .where('code', 'in', codes)
            .execute();

          if (existingLocales.length > 0) {
            const conflictingCodes = existingLocales.map(c => c.code);
            throw new ConflictError(`Locale codes already exist in system database: ${conflictingCodes.join(', ')}`);
          }

          await transaction
            .insertInto('locales')
            .values(values)
            .returning(['id'])
            .execute();
          break;
        }
      }
    };

    if (foodsTransaction) {
      await foodsImpl(foodsTransaction);
    }
    else {
      await kyselyDb.foods.transaction().execute(foodsImpl);
    }

    if (systemTransaction) {
      await systemImpl(systemTransaction);
    }
    else {
      await kyselyDb.system.transaction().execute(systemImpl);
    }
  };

  /**
   * Queue locale tasks
   *
   * @param {QueueJob} input
   * @returns
   */
  const queueTask = async (input: QueueJob) => scheduler.jobs.addJob(input);

  return {
    getFoodBuilders,
    setFoodBuilders,
    getSplitLists,
    setSplitLists,
    getSplitWords,
    setSplitWords,
    getSynonymSets,
    setSynonymSets,
    queueTask,
    bulkUpdateLocales,
  };
}

export default localeService;

export type LocaleService = ReturnType<typeof localeService>;
