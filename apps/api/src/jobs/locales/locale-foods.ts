import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';
import type { CategoryPortionSizeMethod, FoodPortionSizeMethod } from '@intake24/db';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format } from 'date-fns';
import { pick } from 'lodash-es';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Food, SystemLocale } from '@intake24/db';

import BaseJob from '../job';

export type ItemTransform = {
  food: Food;
  dat: {
    attributes: Record<string, InheritableAttributes | null>;
    categoryIds: string[];
    categoryCodes: string[];
    portionSizeMethods: (CategoryPortionSizeMethod | FoodPortionSizeMethod)[];
  };
};

export default class LocaleFoods extends BaseJob<'LocaleFoods'> {
  readonly name = 'LocaleFoods';

  private dbJob!: DbJob;

  private readonly fsConfig;

  private readonly cachedParentCategoriesService;
  private readonly foodSearchService;
  private readonly portionSizeMethodsService;

  constructor({
    fsConfig,
    logger,
    cachedParentCategoriesService,
    foodSearchService,
    portionSizeMethodsService,
  }: Pick<
    IoC,
    | 'cachedParentCategoriesService'
    | 'foodSearchService'
    | 'fsConfig'
    | 'logger'
    | 'portionSizeMethodsService'
  >) {
    super({ logger });

    this.foodSearchService = foodSearchService;
    this.fsConfig = fsConfig;
    this.cachedParentCategoriesService = cachedParentCategoriesService;
    this.portionSizeMethodsService = portionSizeMethodsService;
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

    const total = await Food.count({ where: { localeId: localeCode } });

    const fields = [
      { label: 'Locale', value: 'localeId' },
      { label: 'Food ID', value: 'id' },
      { label: 'Food code', value: 'code' },
      { label: 'English name', value: 'englishName' },
      { label: 'Local name', value: 'name' },
      { label: 'Alternative names', value: 'altNames' },
      { label: 'Tags', value: 'tags' },
      { label: 'FCT', value: 'nutrientTableId' },
      { label: 'FCT record ID', value: 'nutrientTableRecordId' },
      { label: 'Attr: Ready Meal', value: 'readyMealOption' },
      { label: 'Attr: Same As Before', value: 'sameAsBeforeOption' },
      { label: 'Attr: Reasonable Amount', value: 'reasonableAmount' },
      { label: 'Attr: Use In Recipes', value: 'useInRecipes' },
      { label: 'Attr: Ready Meal (Effective)', value: 'readyMealOptionEffective' },
      { label: 'Attr: Same As Before (Effective)', value: 'sameAsBeforeOptionEffective' },
      { label: 'Attr: Reasonable Amount (Effective)', value: 'reasonableAmountEffective' },
      { label: 'Attr: Use In Recipes (Effective)', value: 'useInRecipesEffective' },
      { label: 'Associated Food / Category', value: 'associatedFoods' },
      { label: 'Brands', value: 'brands' },
      { label: 'Category IDs', value: 'categoryIds' },
      { label: 'Category Codes', value: 'categoryCodes' },
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

    const foods = Food.findAllWithStream({
      where: { localeId: localeCode },
      include: [
        { association: 'associatedFoods' },
        { association: 'attributes' },
        { association: 'brands' },
        { association: 'nutrientRecords' },
        { association: 'portionSizeMethods' },
      ],
      order: [['code', 'asc']],
      transform: async (food: Food) => {
        const [attributes, categoryIds, categoryCodes, portionSizeMethods] = await Promise.all([
          this.foodSearchService.getFoodAttributes([food.id]),
          this.cachedParentCategoriesService.getFoodAllCategories(food.id),
          this.cachedParentCategoriesService.getFoodAllCategoryCodes(food.id),
          food.portionSizeMethods?.length
            ? this.portionSizeMethodsService.resolvePortionSizeMethods(food.id)
            : ([] as (CategoryPortionSizeMethod | FoodPortionSizeMethod)[]),
        ]);

        return { food, dat: { attributes, categoryIds, categoryCodes, portionSizeMethods } };
      },
    });

    const transform = new Transform(
      {
        fields,
        withBOM: true,
        transforms: [
          ({ food, dat }: ItemTransform) => {
            const {
              id,
              code,
              localeId,
              englishName,
              name,
              altNames,
              attributes,
              brands = [],
              associatedFoods = [],
              nutrientRecords = [],
              portionSizeMethods: foodPSMs = [],
              tags,
            } = food;
            const { attributes: datAttributes, categoryIds, categoryCodes, portionSizeMethods: datPSMs } = dat;

            return {
              id,
              code,
              localeId,
              englishName,
              name,
              altNames: Object.values(altNames).reduce<string[]>((acc, names) => {
                acc.push(...names);
                return acc;
              }, []).join(', '),
              tags: tags.join(', '),
              nutrientTableId: nutrientRecords[0]?.nutrientTableId,
              nutrientTableRecordId: nutrientRecords[0]?.nutrientTableRecordId,
              readyMealOption: attributes?.readyMealOption ?? 'Inherited',
              sameAsBeforeOption: attributes?.sameAsBeforeOption ?? 'Inherited',
              reasonableAmount: attributes?.reasonableAmount ?? 'Inherited',
              useInRecipes: attributes?.useInRecipes
                ? ['Anywhere', 'RegularFoodsOnly', 'RecipesOnly'][attributes.useInRecipes]
                : 'Inherited',
              readyMealOptionEffective: datAttributes[id]?.readyMealOption ?? 'N/A',
              sameAsBeforeOptionEffective: datAttributes[id]?.sameAsBeforeOption ?? 'N/A',
              reasonableAmountEffective: datAttributes[id]?.reasonableAmount ?? 'N/A',
              useInRecipesEffective: datAttributes[id]?.useInRecipes
                ? ['Anywhere', 'RegularFoodsOnly', 'RecipesOnly'][
                    datAttributes[id]?.useInRecipes as number
                  ]
                : 'N/A',
              associatedFoods: associatedFoods
                .map(
                  ({ associatedFoodCode, associatedCategoryCode }) =>
                    associatedFoodCode ?? associatedCategoryCode,
                )
                .join(', '),
              categoryIds: categoryIds.join(', '),
              categoryCodes: categoryCodes.join(', '),
              brands: brands.map(({ name }) => name).join(', '),
              portionSizeMethods: (foodPSMs.length ? foodPSMs : datPSMs)
                .map((psm) => {
                  const attr = Object.entries(pick(psm, ['method', 'description', 'useForRecipes', 'conversionFactor', 'orderBy'])).map(
                    ([key, value]) => `${key}: ${value?.toString()}`,
                  ).join(', ');
                  const params = Object.entries(psm.parameters).map(
                    ([key, value]) => `${key}: ${value?.toString()}`,
                  ).join(', ');
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
      await pipeline(foods, transform, output);
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
