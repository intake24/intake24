import type { Job as BullJob } from 'bullmq';
import type { Transaction } from 'kysely';

import type { LocalisableMessage } from '@intake24/api/http/errors/localisable.error';
import type { IoC } from '@intake24/api/ioc';
import type { CacheKey } from '@intake24/api/services/core/redis/cache';
import type { FoodsDB, SystemDB } from '@intake24/db';

import { sql } from 'kysely';

import { AggregateLocalisableError, NotFoundError } from '@intake24/api/http/errors';
import { Job as DbJob, SystemLocale } from '@intake24/db';

import BaseJob from '../job';

type FoodRow = {
  id: string;
  code: string;
  name: string;
  parentCategoryCodes: string[];
};

type FoodReference = {
  id: string;
  code: string;
};

type DuplicateFoodSet = {
  primary: FoodReference;
  duplicates: FoodReference[];
};

type LocaleDeduplicateFoodsResult = {
  localeId: string;
  localeCode: string;
  dryRun: boolean;
  duplicateSets: number;
  deletedFoods: number;
  submissionFoodsUpdated: number;
  associatedFoodReferencesUpdated: number;
  popularityCounterRowsMerged: number;
  pairwiseAssociationsOccurrencesRowsDeleted: number;
  cacheKeysInvalidated: number;
};

type DuplicateCodeMapping = {
  duplicateCode: string;
  primaryCode: string;
};

const duplicateSetBatchSize = 200;

function toNumber(value: bigint | number | string | undefined): number {
  if (value === undefined)
    return 0;

  if (typeof value === 'number')
    return value;

  if (typeof value === 'bigint')
    return Number(value);

  return Number.parseInt(value, 10);
}

function getFoodCacheKeys(localeCode: string, foodId: string, foodCode: string): CacheKey[] {
  return [
    `food-entry:${foodId}`,
    `food-entry:${localeCode}:${foodCode}`,
    `food-parent-cache:${foodId}`,
    `food-parent-categories:${foodId}`,
  ];
}

export default class LocaleDeduplicateFoods extends BaseJob<'LocaleDeduplicateFoods', LocaleDeduplicateFoodsResult> {
  readonly name = 'LocaleDeduplicateFoods';

  private readonly cache;
  private readonly kyselyDb;

  constructor({ cache, kyselyDb, logger }: Pick<IoC, 'cache' | 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.cache = cache;
    this.kyselyDb = kyselyDb;
  }

  public async run(job: BullJob): Promise<LocaleDeduplicateFoodsResult> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    const locale = await SystemLocale.findByPk(this.params.localeId, { attributes: ['id', 'code'] });
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${this.params.localeId}).`);

    const localeCode = locale.code;
    const dryRun = this.params.dryRun ?? false;
    const duplicateGroups = await this.findDuplicateFoods(localeCode);

    if (!duplicateGroups.length) {
      this.logger.info(`No duplicate foods found for locale ${localeCode}.`);

      return {
        localeId: this.params.localeId,
        localeCode,
        dryRun,
        duplicateSets: 0,
        deletedFoods: 0,
        submissionFoodsUpdated: 0,
        associatedFoodReferencesUpdated: 0,
        popularityCounterRowsMerged: 0,
        pairwiseAssociationsOccurrencesRowsDeleted: 0,
        cacheKeysInvalidated: 0,
      };
    }

    const duplicateSets = this.selectPrimaryFoods(localeCode, duplicateGroups);
    const duplicateSetBatches = this.batchDuplicateSets(duplicateSets);

    this.initProgress(duplicateSets.length * 2);

    const result: LocaleDeduplicateFoodsResult = {
      localeId: this.params.localeId,
      localeCode,
      dryRun,
      duplicateSets: duplicateSets.length,
      deletedFoods: 0,
      submissionFoodsUpdated: 0,
      associatedFoodReferencesUpdated: 0,
      popularityCounterRowsMerged: 0,
      pairwiseAssociationsOccurrencesRowsDeleted: 0,
      cacheKeysInvalidated: 0,
    };

    const cacheKeys = [...new Set(duplicateSets.flatMap(duplicateSet => [
      ...getFoodCacheKeys(localeCode, duplicateSet.primary.id, duplicateSet.primary.code),
      ...duplicateSet.duplicates.flatMap(food => getFoodCacheKeys(localeCode, food.id, food.code)),
    ]))];

    if (dryRun) {
      for (const duplicateSetBatch of duplicateSetBatches) {
        result.submissionFoodsUpdated += await this.countSurveySubmissionFoods(localeCode, duplicateSetBatch);
        result.popularityCounterRowsMerged += await this.countPopularityCounterChanges(duplicateSetBatch);
        result.pairwiseAssociationsOccurrencesRowsDeleted += await this.countPairwiseAssociationsOccurrencesChanges(localeCode, duplicateSetBatch);

        await this.incrementProgress(duplicateSetBatch.length);
      }

      for (const duplicateSetBatch of duplicateSetBatches) {
        result.associatedFoodReferencesUpdated += await this.countAssociatedFoodReferences(localeCode, duplicateSetBatch);
        result.deletedFoods += await this.countDuplicateFoods(localeCode, duplicateSetBatch);

        await this.incrementProgress(duplicateSetBatch.length);
      }
    }
    else {
      await this.kyselyDb.system.transaction().execute(async (trx) => {
        for (const duplicateSetBatch of duplicateSetBatches) {
          result.submissionFoodsUpdated += await this.replaceSurveySubmissionFoods(trx, localeCode, duplicateSetBatch);
          result.popularityCounterRowsMerged += await this.mergePopularityCounters(trx, duplicateSetBatch);
          result.pairwiseAssociationsOccurrencesRowsDeleted += await this.cleanPairwiseAssociationsOccurrences(trx, localeCode, duplicateSetBatch);

          await this.incrementProgress(duplicateSetBatch.length);
        }
      });

      await this.kyselyDb.foods.transaction().execute(async (trx) => {
        for (const duplicateSetBatch of duplicateSetBatches) {
          result.associatedFoodReferencesUpdated += await this.replaceAssociatedFoods(trx, localeCode, duplicateSetBatch);
          result.deletedFoods += await this.deleteDuplicateFoods(trx, localeCode, duplicateSetBatch);

          await this.incrementProgress(duplicateSetBatch.length);
        }
      });

      await Promise.all([
        cacheKeys.length ? this.cache.forget(cacheKeys) : Promise.resolve(true),
        this.cache.setAdd('locales-index', localeCode),
      ]);
    }

    result.cacheKeysInvalidated = cacheKeys.length;

    return result;
  }

  private async findDuplicateFoods(localeCode: string): Promise<FoodRow[][]> {
    // Should be ok without batching for the typical 2-3 thoudsand food records in locale
    const foodRows = await this.kyselyDb.foods
      .selectFrom('foods')
      .select(['foods.id', 'foods.code', 'foods.name'])
      .where('foods.localeId', '=', localeCode)
      .orderBy('foods.code')
      .execute();

    const foods = new Map<string, FoodRow>();

    for (const foodRow of foodRows) {
      if (!foodRow.name)
        continue;

      foods.set(foodRow.id, {
        id: foodRow.id,
        code: foodRow.code,
        name: foodRow.name,
        parentCategoryCodes: [],
      });
    }

    if (!foods.size)
      return [];

    const parentCategoryRows = await this.kyselyDb.foods
      .selectFrom('foodsCategories')
      .innerJoin('categories', 'categories.id', 'foodsCategories.categoryId')
      .select(['foodsCategories.foodId', 'categories.code'])
      .where('foodsCategories.foodId', 'in', [...foods.keys()])
      .execute();

    for (const row of parentCategoryRows) {
      const food = foods.get(row.foodId);

      if (food)
        food.parentCategoryCodes.push(row.code);
    }

    const duplicateFoods = new Map<string, FoodRow[]>();

    for (const food of foods.values()) {
      food.parentCategoryCodes = [...new Set(food.parentCategoryCodes)].toSorted();

      // Some food records have the same names intentionally (e.g. milk as a drink/milk in hot drinks),
      // so we have to use parent categories to differentiate them and avoid unwanted merging
      const key = `${food.name}.${food.parentCategoryCodes.join('.')}`;

      const group = duplicateFoods.get(key) ?? [];
      group.push(food);
      duplicateFoods.set(key, group);
    }

    return [...duplicateFoods.values()].filter(group => group.length > 1);
  }

  private batchDuplicateSets(duplicateSets: DuplicateFoodSet[]): DuplicateFoodSet[][] {
    const batches: DuplicateFoodSet[][] = [];

    for (let i = 0; i < duplicateSets.length; i += duplicateSetBatchSize)
      batches.push(duplicateSets.slice(i, i + duplicateSetBatchSize));

    return batches;
  }

  private selectPrimaryFoods(localeCode: string, duplicateGroups: FoodRow[][]): DuplicateFoodSet[] {
    const primaryCodes = new Set(this.params.primaryCodes);
    const errors: LocalisableMessage[] = [];
    const duplicateSets: DuplicateFoodSet[] = [];

    for (const group of duplicateGroups) {
      const matchingPrimaryFoods = group.filter(foodRow => primaryCodes.has(foodRow.code));

      if (matchingPrimaryFoods.length === 0) {
        errors.push(
          {
            key: 'jobs.types.LocaleDeduplicateFoods.errors.noPrimaryCode',
            params: {
              name: group[0]?.name ?? '',
              codes: group.map(food => food.code).join(', '),
            },
          },
        );

        continue;
      }

      if (matchingPrimaryFoods.length > 1) {
        errors.push(
          {
            key: 'jobs.types.LocaleDeduplicateFoods.errors.multiplePrimaryCodes',
            params: {
              name: group[0]?.name ?? '',
              codes: group.map(food => food.code).join(', '),
              primaryCodes: matchingPrimaryFoods.map(food => food.code).join(', '),
            },
          },
        );

        continue;
      }

      const primary = matchingPrimaryFoods[0]!;

      duplicateSets.push({
        primary: { id: primary.id, code: primary.code },
        duplicates: group
          .filter(food => food.code !== primary.code)
          .map(food => ({ id: food.id, code: food.code })),
      });
    }

    if (errors.length)
      throw new AggregateLocalisableError(errors);

    return duplicateSets;
  }

  private createDuplicateCodeMappings(duplicateSets: DuplicateFoodSet[]): DuplicateCodeMapping[] {
    return duplicateSets.flatMap(duplicateSet =>
      duplicateSet.duplicates.map(duplicate => ({
        duplicateCode: duplicate.code,
        primaryCode: duplicateSet.primary.code,
      })),
    );
  }

  private getDuplicateCodes(duplicateSets: DuplicateFoodSet[]): string[] {
    return [...new Set(this.createDuplicateCodeMappings(duplicateSets).map(mapping => mapping.duplicateCode))];
  }

  private getDuplicateFoodIds(duplicateSets: DuplicateFoodSet[]): string[] {
    return [...new Set(duplicateSets.flatMap(duplicateSet => duplicateSet.duplicates.map(duplicate => duplicate.id)))];
  }

  private async replaceSurveySubmissionFoods(trx: Transaction<SystemDB>, localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodeMappings = this.createDuplicateCodeMappings(duplicateSets);
    if (!duplicateCodeMappings.length)
      return 0;

    const result = await trx
      .updateTable('surveySubmissionFoods')
      .set({
        code: sql<string>`case ${sql.ref('code')} ${sql.join(duplicateCodeMappings.map(mapping => sql`when ${mapping.duplicateCode} then ${mapping.primaryCode}`), sql` `)} else ${sql.ref('code')} end`,
      })
      .where('locale', '=', localeCode)
      .where('code', 'in', duplicateCodeMappings.map(mapping => mapping.duplicateCode))
      .executeTakeFirst();

    return toNumber(result.numUpdatedRows);
  }

  private async countSurveySubmissionFoods(localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodes = this.getDuplicateCodes(duplicateSets);
    if (!duplicateCodes.length)
      return 0;

    const { count } = await this.kyselyDb.system
      .selectFrom('surveySubmissionFoods')
      .select(({ fn }) => [fn.count<number>('code').as('count')])
      .where('locale', '=', localeCode)
      .where('code', 'in', duplicateCodes)
      .executeTakeFirstOrThrow();

    return toNumber(count);
  }

  private async mergePopularityCounters(trx: Transaction<SystemDB>, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const relevantCodes = [...new Set(duplicateSets.flatMap(duplicateSet => [duplicateSet.primary.code, ...duplicateSet.duplicates.map(duplicate => duplicate.code)]))];
    const rows = await trx
      .selectFrom('popularityCounters')
      .select(['foodCode', 'counter'])
      .where('foodCode', 'in', relevantCodes)
      .execute();

    const rowsByCode = new Map(rows.map(row => [row.foodCode, row]));
    const upserts: { foodCode: string; counter: number }[] = [];
    const deleteCodes: string[] = [];

    for (const duplicateSet of duplicateSets) {
      const duplicateCodes = duplicateSet.duplicates.map(duplicate => duplicate.code);
      const relevantRows = [duplicateSet.primary.code, ...duplicateCodes]
        .map(code => rowsByCode.get(code))
        .filter((row): row is { foodCode: string; counter: number } => !!row);

      if (!relevantRows.length)
        continue;

      const counter = relevantRows.reduce((sum, row) => sum + row.counter, 0);
      const primaryRow = rowsByCode.get(duplicateSet.primary.code);
      const duplicateRows = duplicateCodes
        .map(code => rowsByCode.get(code))
        .filter((row): row is { foodCode: string; counter: number } => !!row);

      deleteCodes.push(...duplicateRows.map(row => row.foodCode));

      if (!primaryRow || primaryRow.counter !== counter) {
        upserts.push({
          foodCode: duplicateSet.primary.code,
          counter,
        });
      }
    }

    if (!upserts.length && !deleteCodes.length)
      return 0;

    let affectedRows = 0;

    if (upserts.length) {
      const insertResult = await trx
        .insertInto('popularityCounters')
        .values(upserts)
        .onConflict(oc => oc
          .column('foodCode')
          .doUpdateSet({
            counter: eb => eb.ref('excluded.counter'),
          }))
        .executeTakeFirst();

      affectedRows += toNumber(insertResult.numInsertedOrUpdatedRows);
    }

    if (deleteCodes.length) {
      const deleteResult = await trx
        .deleteFrom('popularityCounters')
        .where('foodCode', 'in', deleteCodes)
        .executeTakeFirst();

      affectedRows += toNumber(deleteResult.numDeletedRows);
    }

    return affectedRows;
  }

  private async countPopularityCounterChanges(duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const relevantCodes = [...new Set(duplicateSets.flatMap(duplicateSet => [duplicateSet.primary.code, ...duplicateSet.duplicates.map(duplicate => duplicate.code)]))];
    const rows = await this.kyselyDb.system
      .selectFrom('popularityCounters')
      .select(['foodCode', 'counter'])
      .where('foodCode', 'in', relevantCodes)
      .execute();

    const rowsByCode = new Map(rows.map(row => [row.foodCode, row]));
    let affectedRows = 0;

    for (const duplicateSet of duplicateSets) {
      const duplicateCodes = duplicateSet.duplicates.map(duplicate => duplicate.code);
      const relevantRows = [duplicateSet.primary.code, ...duplicateCodes]
        .map(code => rowsByCode.get(code))
        .filter((row): row is { foodCode: string; counter: number } => !!row);

      if (!relevantRows.length)
        continue;

      const counter = relevantRows.reduce((sum, row) => sum + row.counter, 0);
      const primaryRow = rowsByCode.get(duplicateSet.primary.code);
      const duplicateRows = duplicateCodes
        .map(code => rowsByCode.get(code))
        .filter((row): row is { foodCode: string; counter: number } => !!row);

      affectedRows += duplicateRows.length;

      if (!primaryRow || primaryRow.counter !== counter)
        affectedRows += 1;
    }

    return affectedRows;
  }

  private async cleanPairwiseAssociationsOccurrences(trx: Transaction<SystemDB>, localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodes = this.getDuplicateCodes(duplicateSets);
    if (!duplicateCodes.length)
      return 0;

    const deleteResult = await trx
      .deleteFrom('pairwiseAssociationsOccurrences')
      .where('localeId', '=', localeCode)
      .where('foodCode', 'in', duplicateCodes)
      .executeTakeFirst();

    return toNumber(deleteResult.numDeletedRows);
  }

  private async countPairwiseAssociationsOccurrencesChanges(localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodes = this.getDuplicateCodes(duplicateSets);
    if (!duplicateCodes.length)
      return 0;

    const { count } = await this.kyselyDb.system
      .selectFrom('pairwiseAssociationsOccurrences')
      .select(({ fn }) => [fn.count<number>('foodCode').as('count')])
      .where('localeId', '=', localeCode)
      .where('foodCode', 'in', duplicateCodes)
      .executeTakeFirstOrThrow();

    return toNumber(count);
  }

  private async replaceAssociatedFoods(trx: Transaction<FoodsDB>, localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodeMappings = this.createDuplicateCodeMappings(duplicateSets);
    if (!duplicateCodeMappings.length)
      return 0;

    const result = await trx
      .updateTable('associatedFoods')
      .from('foods')
      .set({
        associatedFoodCode: sql<string>`case ${sql.ref('associatedFoodCode')} ${sql.join(duplicateCodeMappings.map(mapping => sql`when ${mapping.duplicateCode} then ${mapping.primaryCode}`), sql` `)} else ${sql.ref('associatedFoodCode')} end`,
      })
      .whereRef('foods.id', '=', 'associatedFoods.foodId')
      .where('foods.localeId', '=', localeCode)
      .where('associatedFoods.associatedFoodCode', 'in', duplicateCodeMappings.map(mapping => mapping.duplicateCode))
      .executeTakeFirst();

    return toNumber(result.numUpdatedRows);
  }

  private async countAssociatedFoodReferences(localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateCodes = this.getDuplicateCodes(duplicateSets);
    if (!duplicateCodes.length)
      return 0;

    const { count } = await this.kyselyDb.foods
      .selectFrom('associatedFoods')
      .innerJoin('foods', 'foods.id', 'associatedFoods.foodId')
      .select(({ fn }) => [fn.count<number>('associatedFoods.foodId').as('count')])
      .where('foods.localeId', '=', localeCode)
      .where('associatedFoods.associatedFoodCode', 'in', duplicateCodes)
      .executeTakeFirstOrThrow();

    return toNumber(count);
  }

  private async deleteDuplicateFoods(trx: Transaction<FoodsDB>, localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateFoodIds = this.getDuplicateFoodIds(duplicateSets);
    if (!duplicateFoodIds.length)
      return 0;

    const result = await trx
      .deleteFrom('foods')
      .where('localeId', '=', localeCode)
      .where('id', 'in', duplicateFoodIds)
      .executeTakeFirst();

    return toNumber(result.numDeletedRows);
  }

  private async countDuplicateFoods(localeCode: string, duplicateSets: DuplicateFoodSet[]): Promise<number> {
    const duplicateFoodIds = this.getDuplicateFoodIds(duplicateSets);
    if (!duplicateFoodIds.length)
      return 0;

    const { count } = await this.kyselyDb.foods
      .selectFrom('foods')
      .select(({ fn }) => [fn.count<number>('id').as('count')])
      .where('localeId', '=', localeCode)
      .where('id', 'in', duplicateFoodIds)
      .executeTakeFirstOrThrow();

    return toNumber(count);
  }
}
