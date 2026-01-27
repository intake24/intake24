import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import BaseJob from '../job';

export default class LocaleIndexBuild extends BaseJob<'LocaleIndexBuild'> {
  readonly name = 'LocaleIndexBuild';
  private readonly cacheKey = 'locales-index';

  private readonly cache;

  constructor({ cache, logger }: Pick<IoC, 'cache' | 'logger'>) {
    super({ logger });

    this.cache = cache;
  }

  /**
  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    const locales = this.params.force ? ['all'] : await this.cache.setMembers(this.cacheKey);
    if (locales.length) {
      this.logger.info('Locale Ids for rebuilding:', locales);
      await Promise.all([
        this.cache.forget(this.cacheKey),
        this.cache.publish(this.cacheKey, locales),
      ]);
    }
    else {
      this.logger.info('No locales specified. No Rebuilding is necessary');
    }

    this.logger.debug('Job finished.');
  }
}
