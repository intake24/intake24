import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Card } from '@intake24/common/feedback';

import {
  cardDefaults,
  demographicGroupDefaults,
  demographicGroupScaleSectorDefaults,
} from '@intake24/common/feedback';
import { merge } from '@intake24/common/util';

import BaseJob from '../job';

export default class FeedbackSchemesSync extends BaseJob<'FeedbackSchemesSync'> {
  readonly name = 'FeedbackSchemesSync';

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
   * @memberof FeedbackSchemesSync
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    await this.synchronizeSchemes();

    this.logger.debug('Job finished.');
  }

  private getCardMap() {
    return cardDefaults.reduce<Record<string, Card>>(
      (acc, card) => {
        acc[card.type] = card;
        return acc;
      },
      {},
    );
  }

  private async synchronizeSchemes(): Promise<void> {
    this.logger.debug(`Synchronization of feedback schemes started.`);

    const cardMap = this.getCardMap();

    const schemes = await this.models.system.FeedbackScheme.findAll({
      attributes: ['id', 'name', 'cards', 'demographicGroups'],
      order: [['id', 'ASC']],
    });

    for (const scheme of schemes) {
      const cards = scheme.cards.map((card: Card) => merge<Card>(cardMap[card.type], card));
      const demographicGroups = scheme.demographicGroups.map(group =>
        merge(demographicGroupDefaults, {
          ...group,
          scaleSectors: group.scaleSectors.map(sector =>
            merge(demographicGroupScaleSectorDefaults, sector),
          ),
        }),
      );

      await scheme.update({ cards, demographicGroups });
    }

    this.logger.debug(`Synchronization of feedback schemes finished.`);
  }
}
