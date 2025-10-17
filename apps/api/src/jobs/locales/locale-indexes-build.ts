import type { Job } from 'bullmq';
import type { IoC } from '@intake24/api/ioc';
import BaseJob from '../job';

export default class LocaleIndexBuild extends BaseJob<'LocaleIndexBuild'> {
  readonly name = 'LocaleIndexBuild';
  private readonly cacheKey = 'locales-index';

  private readonly cache;
  private readonly foodIndex;

  constructor({ cache, logger, foodIndex }: Pick<IoC, 'cache' | 'logger' | 'foodIndex'>) {
    super({ logger });

    this.cache = cache;
    this.foodIndex = foodIndex;
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

    const locales = await this.cache.setMembers(this.cacheKey);
    if (locales.length) {
      this.logger.info('Locale Ids for rebuilding:', locales);
      await Promise.all([
        this.cache.forget(this.cacheKey),
        this.foodIndex.rebuild(locales.includes('all') ? undefined : locales),
      ]);
    }
    else {
      this.logger.info('No locales specified. No Rebuilding is necessary');
    }

    this.logger.debug('Job finished.');
  }
}
