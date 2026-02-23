import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { ResolvedParentData } from '@intake24/api/services';
import type { CategoryPortionSizeMethod, FoodPortionSizeMethod } from '@intake24/db';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format } from 'date-fns';
import { pick } from 'lodash-es';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Category, Job as DbJob, SystemLocale } from '@intake24/db';

import BaseJob from '../job';

export type ItemTransform = {
  category: Category;
  dat: {
    cache: ResolvedParentData;
    portionSizeMethods: (CategoryPortionSizeMethod | FoodPortionSizeMethod)[];
  };
};

export default class LocaleCategories extends BaseJob<'LocaleCategories'> {
  readonly name = 'LocaleCategories';

  private dbJob!: DbJob;

  private readonly fsConfig;

  private readonly cachedParentCategoriesService;
  private readonly portionSizeMethodsService;

  constructor({
    fsConfig,
    logger,
    cachedParentCategoriesService,
    portionSizeMethodsService,
  }: Pick<
    IoC,
    | 'cachedParentCategoriesService'
    | 'fsConfig'
    | 'logger'
    | 'portionSizeMethodsService'
  >) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.cachedParentCategoriesService = cachedParentCategoriesService;
    this.portionSizeMethodsService = portionSizeMethodsService;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.exportData();

    this.logger.debug('Job finished.');
  }

  private async prepareExportInfo() {
    const { localeId } = this.params;
    const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${localeId}).`);

    const { code: localeCode } = locale;

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${localeCode}-${timestamp}.csv`;

    const total = await Category.count({ where: { localeId: localeCode } });

    const fields = [
      { label: 'Locale', value: 'localeId' },
      { label: 'Category ID', value: 'id' },
      { label: 'Category code', value: 'code' },
      { label: 'English name', value: 'englishName' },
      { label: 'Local name', value: 'name' },
      { label: 'Tags', value: 'tags' },
      { label: 'Tags (Effective)', value: 'tagsEffective' },
      { label: 'Attr: Ready Meal', value: 'readyMealOption' },
      { label: 'Attr: Same As Before', value: 'sameAsBeforeOption' },
      { label: 'Attr: Reasonable Amount', value: 'reasonableAmount' },
      { label: 'Attr: Use In Recipes', value: 'useInRecipes' },
      { label: 'Attr: Ready Meal (Effective)', value: 'readyMealOptionEffective' },
      { label: 'Attr: Same As Before (Effective)', value: 'sameAsBeforeOptionEffective' },
      { label: 'Attr: Reasonable Amount (Effective)', value: 'reasonableAmountEffective' },
      { label: 'Attr: Use In Recipes (Effective)', value: 'useInRecipesEffective' },
      { label: 'Parent category IDs', value: 'categoryIds' },
      { label: 'Parent category Codes', value: 'categoryCodes' },
      { label: 'Portion Size methods', value: 'portionSizeMethods' },
    ];

    return { localeCode, filename, fields, total };
  }

  private async exportData(): Promise<void> {
    const { localeCode, fields, filename, total } = await this.prepareExportInfo();

    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const filepath = path.resolve(this.fsConfig.local.downloads, filename);
    const output = createWriteStream(filepath, { encoding: 'utf-8', flags: 'w+' });

    const categories = Category.findAllWithStream({
      where: { localeId: localeCode },
      include: [
        { association: 'attributes' },
        { association: 'portionSizeMethods' },
      ],
      order: [['code', 'asc']],
      transform: async (category: Category) => {
        const [cache, portionSizeMethods] = await Promise.all([
          this.cachedParentCategoriesService.getCategoryCache(category.id),
          category.portionSizeMethods?.length
            ? this.portionSizeMethodsService.getCategoryPortionSizeMethods(category.id)
            : [],
        ]);

        return { category, dat: { cache, portionSizeMethods } };
      },
    });

    const transform = new Transform(
      {
        fields,
        withBOM: true,
        transforms: [
          ({ category, dat }: ItemTransform) => {
            const {
              id,
              code,
              localeId,
              englishName,
              name,
              attributes,
              portionSizeMethods: categoryPSMs = [],
              tags,
            } = category;
            const { cache, portionSizeMethods: datPSMs } = dat;

            return {
              id,
              code,
              localeId,
              englishName,
              name,
              tags: tags.toSorted().join(', '),
              tagsEffective: cache.tags.join(','),
              readyMealOption: attributes?.readyMealOption ?? 'Inherited',
              sameAsBeforeOption: attributes?.sameAsBeforeOption ?? 'Inherited',
              reasonableAmount: attributes?.reasonableAmount ?? 'Inherited',
              useInRecipes: attributes?.useInRecipes != null ? ['Anywhere', 'RegularFoodsOnly', 'RecipesOnly'][attributes.useInRecipes] : 'Inherited',
              readyMealOptionEffective: cache.attributes.readyMealOption ?? 'N/A',
              sameAsBeforeOptionEffective: cache.attributes.sameAsBeforeOption ?? 'N/A',
              reasonableAmountEffective: cache.attributes.reasonableAmount ?? 'N/A',
              useInRecipesEffective: ['Anywhere', 'RegularFoodsOnly', 'RecipesOnly'][cache.attributes.useInRecipes] ?? 'N/A',
              categoryIds: cache.ids.join(', '),
              categoryCodes: cache.codes.join(', '),
              portionSizeMethods: (categoryPSMs.length ? categoryPSMs : datPSMs)
                .toSorted((a, b) => Number(a.orderBy) - Number(b.orderBy))
                .map((psm) => {
                  const attr = Object.entries(pick(psm, ['method', 'description', 'pathways', 'conversionFactor', 'orderBy'])).map(
                    ([key, value]) => `${key}: ${value?.toString()}`,
                  ).join('; ');
                  const params = Object.entries(psm.parameters).map(
                    ([key, value]) => `${key}: ${value?.toString()}`,
                  ).join('; ');
                  return `${attr}, ${params}`;
                })
                .join('\n'),
            };
          },
        ],
      },
      {},
      { objectMode: true },
    );

    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(categories, transform, output);
      await this.dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }
}
