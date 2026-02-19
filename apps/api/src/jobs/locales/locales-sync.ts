import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { FoodBuilderStep } from '@intake24/common/types/http/admin';

import { foodStepDefaults } from '@intake24/common/types/http/admin';
import { merge } from '@intake24/common/util';

import BaseJob from '../job';

export default class LocalesSync extends BaseJob<'LocalesSync'> {
  readonly name = 'LocalesSync';

  private readonly models;

  constructor({ models, logger }: Pick<IoC, 'models' | 'logger'>) {
    super({ logger });

    this.models = models;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    await this.synchronizeSchemes();

    this.logger.debug('Job finished.');
  }

  private async synchronizeSchemes(): Promise<void> {
    this.logger.debug('Synchronization of locales started.');

    const builders = await this.models.foods.FoodBuilder.findAll({
      attributes: ['id', 'steps'],
      order: [['id', 'ASC']],
    });

    for (const builder of builders) {
      const steps = this.params.subTasks.includes('foodBuilders') ? builder.steps.map(step => merge<FoodBuilderStep>(foodStepDefaults[step.type], step)) : undefined;

      await builder.update({ steps });
    }

    this.logger.debug('Synchronization of locales finished.');
  }
}
