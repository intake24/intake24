import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { FoodBuilderStep } from '@intake24/common/types/http/admin';

import { foodStepDefaults } from '@intake24/common/types/http/admin';
import { merge } from '@intake24/common/util';

import BaseJob from '../job';

export default class LocalesSync extends BaseJob<'LocalesSync'> {
  readonly name = 'LocalesSync';

  private readonly models;
  private kyselyDb;

  constructor({ models, kyselyDb, logger }: Pick<IoC, 'models' | 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.models = models;
    this.kyselyDb = kyselyDb;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    await this.synchronizeLocales();

    this.logger.debug('Job finished.');
  }

  private async synchronizeLocales(): Promise<void> {
    this.logger.debug('Synchronization of locales started.');

    if (this.params.subTasks.includes('foodBuilders'))
      await this.foodBuilders();

    await this.crossDatabaseRecords();

    this.logger.debug('Synchronization of locales finished.');
  }

  private async crossDatabaseRecords(): Promise<void> {
    const systemLocales = await this.kyselyDb.system
      .selectFrom('locales')
      .select('code')
      .execute();
    const systemLocalesCodes = systemLocales.map(locale => locale.code);

    const missingSystemLocales = await this.kyselyDb.foods
      .selectFrom('locales')
      .selectAll()
      .where('id', 'not in', systemLocalesCodes)
      .execute();

    if (!missingSystemLocales.length)
      return;

    const res = await this.kyselyDb.system
      .insertInto('locales')
      .values(missingSystemLocales
        .map((locale) => {
          const { id, ...rest } = locale;
          return { code: id, ...rest, createdAt: new Date(), updatedAt: new Date() };
        }))
      .executeTakeFirst();

    this.logger.debug(`Inserted ${res?.numInsertedOrUpdatedRows ?? 0} missing locales from food database into system database.`);
  }

  private async foodBuilders(): Promise<void> {
    const builders = await this.models.foods.FoodBuilder.findAll({
      attributes: ['id', 'steps'],
      order: [['id', 'ASC']],
    });

    for (const builder of builders) {
      const steps = builder.steps.map(step => merge<FoodBuilderStep>(foodStepDefaults[step.type], step));

      await builder.update({ steps });
    }
  }
}
