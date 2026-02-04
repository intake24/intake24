import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import type { BulkCategoryInput, BulkFoodInput, LocaleRequest } from '@intake24/common/types/http/admin';
import type { PkgV2CategoriesFile, PkgV2FoodsFile, PkgV2LocalesFile } from '@intake24/common/types/package/file-schemas';

import fs from 'node:fs/promises';
import path from 'node:path';

import { LocalisableError, NotFoundError } from '@intake24/api/http/errors';
import { Job as DbJob, Op } from '@intake24/db';

import BaseJob from '../job';
import { fromPackageCategory, fromPackageFood, fromPackageLocale } from './import/type-conversions';
import { getVerifiedOutputPath } from './import/utils';
import { checkEditFoodListPermissions, checkGlobalLocalePermissions } from './permission-checks';

export default class PackageImport extends BaseJob<'PackageImport'> {
  readonly name = 'PackageImport';

  private dbJob!: DbJob;

  private userId!: string;

  private verifiedPath!: string;

  private readonly globalAclService;

  private readonly adminCategoryService;

  private readonly adminFoodService;

  private readonly localeService;

  private readonly kyselyDb;

  private readonly fsConfig;

  constructor({ logger, globalAclService, adminCategoryService, adminFoodService, localeService, kyselyDb, fsConfig }: Pick<IoC, 'logger' | 'globalAclService' | 'adminCategoryService' | 'adminFoodService' | 'localeService' | 'kyselyDb' | 'fsConfig'>) {
    super({ logger });

    this.globalAclService = globalAclService;
    this.adminCategoryService = adminCategoryService;
    this.adminFoodService = adminFoodService;
    this.localeService = localeService;
    this.kyselyDb = kyselyDb;
    this.fsConfig = fsConfig;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    if (!dbJob.userId)
      throw new NotFoundError(`Job ${this.name}: No user ID associated with job (${this.dbId}).`);

    this.dbJob = dbJob;
    this.userId = dbJob.userId;

    this.logger.debug('Job started.');

    this.verifiedPath = getVerifiedOutputPath(path.resolve(this.fsConfig.local.uploads), this.params.fileId);

    await this.validateExtractedFiles();
    await this.importPackage();

    this.logger.debug('Job finished.');
  }

  private async validateExtractedFiles(): Promise<void> {
    const { verificationJobId, fileId } = this.params;

    // Find the corresponding verification job to check it succeeded
    const verificationJob = await DbJob.findOne({
      where: {
        id: verificationJobId,
        type: 'PackageVerification',
        userId: this.userId,
        successful: true,
        params: {
          [Op.contains]: { fileId } as any, // FIXME: no idea how to do this properly
        },
      },
    });

    if (!verificationJob)
      throw new LocalisableError('io.importJob.invalidVerification');

    try {
      await fs.stat(this.verifiedPath);
    }
    catch {
      throw new LocalisableError('io.importJob.extractedFilesNotFound');
    }

    this.logger.debug(`Confirmed extracted files have been verified.`);
  }

  private async readPackageFile<T>(relativePath: string): Promise<T> {
    const filePath = path.join(this.verifiedPath, relativePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  private async importPackage(): Promise<void> {
    this.logger.debug(`Importing package from: ${this.verifiedPath}`);

    const { localeFilter, foodFilter, categoryFilter, include: includeOptions, conflictStrategies } = this.params.options;

    const filteredLocaleData: LocaleRequest[] = [];
    const filteredCategoryData: Dictionary<BulkCategoryInput[]> = {};
    const filteredFoodData: Dictionary<BulkFoodInput[]> = {};

    const localesWithFoodListChanges: Set<string> = new Set();

    if (includeOptions.includes('locales')) {
      const packageLocales = await this.readPackageFile<PkgV2LocalesFile>('locales.json');

      for (const locale of packageLocales) {
        if (localeFilter?.length && !localeFilter.includes(locale.id))
          continue;

        filteredLocaleData.push(fromPackageLocale(locale));
      }

      if (filteredLocaleData.length) {
        // FIXME: Type check conflictStrategies keys?
        const strategy = conflictStrategies.locales || 'abort';
        await checkGlobalLocalePermissions(this.globalAclService, this.userId, strategy === 'overwrite');
      }
    }

    if (includeOptions.includes('categories')) {
      const packageCategories = await this.readPackageFile<PkgV2CategoriesFile>('categories.json');

      for (const [locale, categories] of Object.entries(packageCategories)) {
        if (localeFilter?.length && !localeFilter.includes(locale))
          continue;

        localesWithFoodListChanges.add(locale);
        filteredCategoryData[locale] = [];

        for (const category of categories) {
          if (categoryFilter?.length && !categoryFilter.includes(category.code))
            continue;

          filteredCategoryData[locale].push(fromPackageCategory(category));
        }
      }
    }

    if (includeOptions.includes('foods')) {
      const packageFoods = await this.readPackageFile<PkgV2FoodsFile>('foods.json');

      for (const [locale, foods] of Object.entries(packageFoods)) {
        if (localeFilter?.length && !localeFilter.includes(locale))
          continue;

        localesWithFoodListChanges.add(locale);
        filteredFoodData[locale] = [];

        for (const food of foods) {
          if (foodFilter?.length && !foodFilter.includes(food.code))
            continue;

          filteredFoodData[locale].push(fromPackageFood(food));
        }
      }
    }

    await checkEditFoodListPermissions(this.globalAclService, this.userId, localesWithFoodListChanges);

    await this.kyselyDb.system.transaction().execute (async (systemTransaction) => {
      await this.kyselyDb.foods.transaction().execute (async (foodsTransaction) => {
        if (filteredLocaleData.length) {
          await this.localeService.bulkUpdateLocales(filteredLocaleData, conflictStrategies.locales || 'abort', foodsTransaction, systemTransaction);
        }

        for (const locale of [...localesWithFoodListChanges].sort()) {
          const categories = filteredCategoryData[locale];
          const foods = filteredFoodData[locale];

          if (categories?.length)
            await this.adminCategoryService.bulkUpdateCategories(locale, categories, conflictStrategies.categories || 'abort', foodsTransaction);

          if (foods?.length)
            await this.adminFoodService.bulkUpdateFoods(locale, foods, conflictStrategies.foods || 'abort', foodsTransaction);
        }
      });
    });

    await this.job.updateProgress(100);
  }
}
