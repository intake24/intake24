import type { Job } from 'bullmq';
import type { Transaction } from 'kysely';
import { sql } from 'kysely';

import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { LocaleCopyFoodsSubTasks, LocaleCopySystemSubTasks } from '@intake24/common/types';
import { Job as DbJob, SystemLocale } from '@intake24/db';
import type { FoodsDB, SystemDB } from '@intake24/db';

import BaseJob from '../job';

export type TransactionOps<T extends FoodsDB | SystemDB> = {
  trx: Transaction<T>;
  code: string;
  sourceCode: string;
};

export default class LocaleCopy extends BaseJob<'LocaleCopy'> {
  readonly name = 'LocaleCopy';

  private dbJob!: DbJob;

  private kyselyDb;

  constructor({
    kyselyDb,
    logger,
  }: Pick<
    IoC,
    'kyselyDb' | 'logger'
  >) {
    super({ logger });

    this.kyselyDb = kyselyDb;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof LocaleFoods
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.copyData();

    this.logger.debug('Job finished.');
  }

  private async copyData() {
    const { localeId, sourceLocaleId, subTasks } = this.params;
    if (!subTasks.length) {
      this.logger.info('No subtasks to run.');
      return;
    }

    const [locale, sourceLocale] = await Promise.all([
      SystemLocale.findByPk(localeId, { attributes: ['code'] }),
      SystemLocale.findByPk(sourceLocaleId, { attributes: ['code'] }),
    ]);
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${localeId}).`);

    if (!sourceLocale)
      throw new NotFoundError(`Job ${this.name}: Source locale not found (${sourceLocale}).`);

    const { code } = locale;
    const { code: sourceCode } = sourceLocale;

    const foodsTasks: LocaleCopyFoodsSubTasks[] = [];
    const systemTasks: LocaleCopySystemSubTasks[] = [];

    this.params.subTasks.forEach((task) => {
      if (['searchPopularity', 'searchFixedRanking'].includes(task))
        systemTasks.push(task as LocaleCopySystemSubTasks);
      else foodsTasks.push(task as LocaleCopyFoodsSubTasks);
    });

    if (foodsTasks.length) {
      await this.kyselyDb.foods.transaction().execute(async (trx) => {
        Promise.all(foodsTasks.map(subTask => this[subTask]({ trx, code, sourceCode })));
      });
    }

    if (systemTasks.length) {
      await this.kyselyDb.system.transaction().execute(async (trx) => {
        Promise.all(systemTasks.map(subTask => this[subTask]({ trx, code, sourceCode })));
      });
    }
  }

  private async brands({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('brands').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of brands cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('brands')
      .columns(['foodCode', 'localeId', 'name'])
      .expression(eb => eb
        .selectFrom('brands')
        .select(eb => [
          'foodCode',
          eb.val(code).as('localeId'),
          'name',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of brands created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async categories({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('categoryLocals').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of local categories cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('categoryLocals')
      .columns(['categoryCode', 'localeId', 'name', 'simpleName', 'tags', 'version'])
      .expression(eb => eb
        .selectFrom('categoryLocals')
        .select(eb => [
          'categoryCode',
          eb.val(code).as('localeId'),
          'name',
          'simpleName',
          'tags',
          'version',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of local categories created: ${insResult.numInsertedOrUpdatedRows}`);

    const psmResult = await trx.insertInto('categoryPortionSizeMethods')
      .columns(['categoryLocalId', 'method', 'description', 'useForRecipes', 'conversionFactor', 'orderBy', 'parameters'])
      .expression(eb => eb
        .selectFrom('categoryPortionSizeMethods as cpsm')
        .innerJoin(
          'categoryLocals as cl1',
          join => join
            .onRef('cl1.id', '=', 'cpsm.categoryLocalId')
            .on('cl1.localeId', '=', sourceCode),
        )
        .innerJoin(
          'categoryLocals as cl2',
          join => join
            .onRef('cl2.categoryCode', '=', 'cl1.categoryCode')
            .on('cl2.localeId', '=', code),
        )
        .select([
          'cl2.id',
          'cpsm.method',
          'cpsm.description',
          'cpsm.useForRecipes',
          'cpsm.conversionFactor',
          'cpsm.orderBy',
          'cpsm.parameters',
        ])
        .orderBy('cpsm.id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of category portion size methods created: ${psmResult.numInsertedOrUpdatedRows}`);
  }

  private async foods({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('foodLocals').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of local foods cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('foodLocals')
      .columns(['foodCode', 'localeId', 'name', 'simpleName', 'altNames', 'tags', 'version'])
      .expression(eb => eb
        .selectFrom('foodLocals')
        .select(eb => [
          'foodCode',
          eb.val(code).as('localeId'),
          'name',
          'simpleName',
          'altNames',
          'tags',
          'version',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of local foods created: ${insResult.numInsertedOrUpdatedRows}`);

    const delListResult = await trx.deleteFrom('foodsLocalLists').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of food list items cleared: ${delListResult.numDeletedRows}`);

    const insListResult = await trx.insertInto('foodsLocalLists')
      .columns(['foodCode', 'localeId'])
      .expression(eb => eb
        .selectFrom('foodsLocalLists')
        .select(eb => ['foodCode', eb.val(code).as('localeId')])
        .where('localeId', '=', sourceCode)
        .orderBy('foodCode'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of food list items created: ${insListResult.numInsertedOrUpdatedRows}`);

    const psmResult = await trx.insertInto('foodPortionSizeMethods')
      .columns(['foodLocalId', 'method', 'description', 'useForRecipes', 'conversionFactor', 'orderBy', 'parameters'])
      .expression(eb => eb
        .selectFrom('foodPortionSizeMethods as fpsm')
        .innerJoin(
          'foodLocals as fl1',
          join => join
            .onRef('fl1.id', '=', 'fpsm.foodLocalId')
            .on('fl1.localeId', '=', sourceCode),
        )
        .innerJoin(
          'foodLocals as fl2',
          join => join
            .onRef('fl2.foodCode', '=', 'fl1.foodCode')
            .on('fl2.localeId', '=', code),
        )
        .select([
          'fl2.id',
          'fpsm.method',
          'fpsm.description',
          'fpsm.useForRecipes',
          'fpsm.conversionFactor',
          'fpsm.orderBy',
          'fpsm.parameters',
        ])
        .orderBy('fpsm.id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of food portion size methods created: ${psmResult.numInsertedOrUpdatedRows}`);

    const npResult = await trx.insertInto('foodsNutrients')
      .columns(['foodLocalId', 'nutrientTableRecordId'])
      .expression(eb => eb
        .selectFrom('foodsNutrients as fn')
        .innerJoin(
          'foodLocals as fl1',
          join => join
            .onRef('fl1.id', '=', 'fn.foodLocalId')
            .on('fl1.localeId', '=', sourceCode),
        )
        .innerJoin(
          'foodLocals as fl2',
          join => join
            .onRef('fl2.foodCode', '=', 'fl1.foodCode')
            .on('fl2.localeId', '=', code),
        )
        .select(['fl2.id', 'fn.nutrientTableRecordId'])
        .orderBy('fn.foodLocalId'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of local food portion size methods created: ${npResult.numInsertedOrUpdatedRows}`);
  }

  private async associatedFoods({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('associatedFoods').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of associated foods cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('associatedFoods')
      .columns(['foodCode', 'localeId', 'associatedFoodCode', 'associatedCategoryCode', 'text', 'linkAsMain', 'genericName', 'orderBy', 'multiple'])
      .expression(eb => eb
        .selectFrom('associatedFoods')
        .select(eb => [
          'foodCode',
          eb.val(code).as('localeId'),
          'associatedFoodCode',
          'associatedCategoryCode',
          'text',
          'linkAsMain',
          'genericName',
          'orderBy',
          'multiple',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of associated foods created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async splitLists({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('splitLists').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of split lists cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('splitLists')
      .columns(['localeId', 'firstWord', 'words'])
      .expression(eb => eb
        .selectFrom('splitLists')
        .select(eb => [
          eb.val(code).as('localeId'),
          'firstWord',
          'words',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of split lists created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async splitWords({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('splitWords').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of split words cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('splitWords')
      .columns(['localeId', 'words'])
      .expression(eb => eb
        .selectFrom('splitWords')
        .select(eb => [
          eb.val(code).as('localeId'),
          'words',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of split words created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async synonymSets({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('synonymSets').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of synonym sets cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('synonymSets')
      .columns(['localeId', 'synonyms'])
      .expression(eb => eb
        .selectFrom('synonymSets')
        .select(eb => [
          eb.val(code).as('localeId'),
          'synonyms',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of synonym sets created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async recipeFoods({ trx, code, sourceCode }: TransactionOps<FoodsDB>) {
    const delResult = await trx.deleteFrom('recipeFoods').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of recipe foods cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('recipeFoods')
      .columns(['code', 'name', 'localeId', 'recipeWord', 'synonymsId', 'createdAt', 'updatedAt'])
      .expression(eb => eb
        .selectFrom('recipeFoods')
        .select(eb => [
          'code',
          'name',
          eb.val(code).as('localeId'),
          'recipeWord',
          eb.lit(null).as('synonymsId'),
          eb.val(new Date()).as('createdAt'),
          eb.val(new Date()).as('updatedAt'),
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of recipe foods created: ${insResult.numInsertedOrUpdatedRows}`);

    const stepsResult = await trx.insertInto('recipeFoodsSteps')
      .columns(['recipeFoodsId', 'code', 'categoryCode', 'localeId', 'name', 'description', 'order', 'repeatable', 'required', 'createdAt', 'updatedAt'])
      .expression(eb => eb
        .selectFrom('recipeFoodsSteps as rfs')
        .innerJoin(
          'recipeFoods as rf1',
          join => join
            .onRef('rf1.id', '=', 'rfs.recipeFoodsId')
            .on('rf1.localeId', '=', sourceCode),
        )
        .innerJoin(
          'recipeFoods as rf2',
          join => join
            .onRef('rf2.code', '=', 'rf1.code')
            .on('rf2.localeId', '=', code),
        )
        .select(eb => [
          'rf2.id',
          sql<string>`concat(rf2.locale_id, '_', rf2.id, '_', rf2.code, '_', rfs.order)`.as('code'),
          'rfs.categoryCode',
          eb.val(code).as('localeId'),
          'rfs.name',
          'rfs.description',
          'rfs.order',
          'rfs.repeatable',
          'rfs.required',
          eb.val(new Date()).as('createdAt'),
          eb.val(new Date()).as('updatedAt'),
        ])
        .orderBy('rfs.id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of recipe food steps created: ${stepsResult.numInsertedOrUpdatedRows}`);
  }

  private async searchFixedRanking({ trx, code, sourceCode }: TransactionOps<SystemDB>) {
    const delResult = await trx.deleteFrom('fixedFoodRanking').where('localeId', '=', code).executeTakeFirst();
    this.logger.debug(`Number of fixed food rankings cleared: ${delResult.numDeletedRows}`);

    const insResult = await trx.insertInto('fixedFoodRanking')
      .columns(['foodCode', 'localeId', 'rank'])
      .expression(eb => eb
        .selectFrom('fixedFoodRanking')
        .select(eb => [
          'foodCode',
          eb.val(code).as('localeId'),
          'rank',
        ])
        .where('localeId', '=', sourceCode)
        .orderBy('id'),
      )
      .executeTakeFirst();

    this.logger.debug(`Number of fixed food rankings created: ${insResult.numInsertedOrUpdatedRows}`);
  }

  private async searchPopularity({ trx, code, sourceCode }: TransactionOps<SystemDB>) {
    const [delOne, delTwo, delThree] = await Promise.all([
      trx.deleteFrom('pairwiseAssociationsOccurrences').where('localeId', '=', code).executeTakeFirst(),
      trx.deleteFrom('pairwiseAssociationsCoOccurrences').where('localeId', '=', code).executeTakeFirst(),
      trx.deleteFrom('pairwiseAssociationsTransactionsCount').where('localeId', '=', code).executeTakeFirst(),
    ]);
    this.logger.debug(`Number of PA occurrences cleared: ${delOne.numDeletedRows}`);
    this.logger.debug(`Number of PA co-occurrences cleared: ${delTwo.numDeletedRows}`);
    this.logger.debug(`Number of PA transactions cleared: ${delThree.numDeletedRows}`);

    const [insOne, insTwo, insThree] = await Promise.all([
      trx.insertInto('pairwiseAssociationsOccurrences')
        .columns(['localeId', 'foodCode', 'occurrences'])
        .expression(eb => eb
          .selectFrom('pairwiseAssociationsOccurrences')
          .select(eb => [
            eb.val(code).as('localeId'),
            'foodCode',
            'occurrences',
          ])
          .where('localeId', '=', sourceCode)
          .orderBy('foodCode'),
        )
        .executeTakeFirst(),
      trx.insertInto('pairwiseAssociationsCoOccurrences')
        .columns(['localeId', 'antecedentFoodCode', 'consequentFoodCode', 'occurrences'])
        .expression(eb => eb
          .selectFrom('pairwiseAssociationsCoOccurrences')
          .select(eb => [
            eb.val(code).as('localeId'),
            'antecedentFoodCode',
            'consequentFoodCode',
            'occurrences',
          ])
          .where('localeId', '=', sourceCode)
          .orderBy('antecedentFoodCode'),
        )
        .executeTakeFirst(),
      trx.insertInto('pairwiseAssociationsTransactionsCount')
        .columns(['localeId', 'transactionsCount'])
        .expression(eb => eb
          .selectFrom('pairwiseAssociationsTransactionsCount')
          .select(eb => [
            eb.val(code).as('localeId'),
            'transactionsCount',
          ])
          .where('localeId', '=', sourceCode),
        )
        .executeTakeFirst(),
    ]);

    this.logger.debug(`Number of PA occurrences created: ${insOne.numInsertedOrUpdatedRows}`);
    this.logger.debug(`Number of PA co-occurrences created: ${insTwo.numInsertedOrUpdatedRows}`);
    this.logger.debug(`Number of PA transactions created: ${insThree.numInsertedOrUpdatedRows}`);
  }
}
