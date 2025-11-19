import { Kysely, sql } from 'kysely';
import { groupBy, mapValues } from 'lodash';
import { localeTranslationStrict } from '@intake24/common/types/common';
import { PackageExportOptions, PackageIncludeOption, packageIncludeOptions } from '@intake24/common/types/http/admin';
import { PkgV2Category } from '@intake24/common/types/package/categories';
import { PkgV2AssociatedFood, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';
import { FoodsDB } from '@intake24/db/kysely';
import { packagePortionSize } from './type-conversions';
import { PackageWriter } from './types';

/**
 * Batches items from an async iterable into arrays of up to `batchSize` elements.
 * Yields full batches as soon as they are ready; yields any remaining items at the end.
 */
export async function* batchStream<T>(
  stream: AsyncIterable<T>,
  batchSize: number,
): AsyncIterableIterator<T[]> {
  if (batchSize < 1) {
    throw new Error('batchSize must be >= 1');
  }

  let batch: T[] = [];

  for await (const item of stream) {
    batch.push(item);

    if (batch.length === batchSize) {
      yield batch;
      batch = []; // start fresh batch
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

/**
 * Groups consecutive rows with the same key (determined by `getKey`) and batches
 * these groups into objects where keys are group IDs and values are arrays of rows.
 *
 * Items are yielded in batches of up to `batchSize` *groups* (not rows).
 * The stream must be sorted/grouped by the key beforehand for correct behavior.
 */
export async function* batchStreamGrouped<T>(
  stream: AsyncIterable<T>,
  getKey: (row: T) => string,
  batchSize: number,
): AsyncIterableIterator<Record<string, T[]>> {
  if (batchSize < 1) {
    throw new Error('batchSize must be >= 1');
  }

  let pendingGroups: Record<string, T[]> = {};
  let currentKey: string | null = null;
  let currentGroup: T[] = [];

  const flushCurrentGroup = () => {
    if (currentKey !== null) {
      pendingGroups[currentKey] = currentGroup;
      currentKey = null;
      currentGroup = [];
    }
  };

  for await (const row of stream) {
    const key = getKey(row);

    // When the key changes, store the previous group (if any)
    if (currentKey !== null && currentKey !== key) {
      flushCurrentGroup();

      // If we have enough groups pending, yield them
      if (Object.keys(pendingGroups).length >= batchSize) {
        yield pendingGroups;
        pendingGroups = {};
      }
    }

    // Start collecting the new group
    currentGroup.push(row);
    currentKey = key;
  }

  // Flush whatever group was left after the loop
  flushCurrentGroup();

  // Yield any remaining groups
  if (Object.keys(pendingGroups).length > 0) {
    yield pendingGroups;
  }
}

const progressWeights: Record<PackageIncludeOption, number> = {
  foods: 0.40,
  categories: 0.10,
  portionSizeMethods: 0.10,
  portionSizeImages: 0.40,
};

export class PackageExporter {
  private readonly db: Kysely<FoodsDB>;
  private readonly packageWriter: PackageWriter;
  private readonly exportOptions: PackageExportOptions;
  private readonly outputPath: string;
  private readonly dbBatchSize: number;
  private readonly updateProgressCallback: (progress: number) => Promise<void>;
  private readonly copyImage: (relativePath: string) => Promise<void>;

  private progress: Map<string, Map<PackageIncludeOption, number>>;
  private asServedSetIds: Set<string>;
  private imageFilePaths: Set<string>;

  constructor(db: Kysely<FoodsDB>, packageWriter: PackageWriter, exportOptions: PackageExportOptions, outputPath: string, updateProgress: (progress: number) => Promise<void>, copyImage: (path: string) => Promise<void>, dbBatchSize: number = 200) {
    this.db = db;
    this.packageWriter = packageWriter;
    this.exportOptions = exportOptions;
    this.outputPath = outputPath;
    this.dbBatchSize = dbBatchSize;
    this.updateProgressCallback = updateProgress;
    this.copyImage = copyImage;

    this.asServedSetIds = new Set<string>();
    this.imageFilePaths = new Set<string>();
    this.progress = new Map<string, Map<PackageIncludeOption, number>>();
  }

  async processFoods(localeId: string): Promise<void> {
    const { count } = await this.db
      .selectFrom('foods')
      .select(this.db.fn.countAll().as('count'))
      .where('foods.localeId', '=', localeId)
      .executeTakeFirstOrThrow();

    const foodRecordCount = Number(count);

    let foodsProcessed = 0;

    const foodsStream = this.db
      .selectFrom('foods')
      .leftJoin('foodAttributes', 'foodAttributes.foodId', 'foods.id')
      .leftJoin('foodThumbnailImages', 'foodThumbnailImages.foodId', 'foods.id')
      .leftJoin('processedImages', 'processedImages.id', 'foodThumbnailImages.imageId')
      .select(['foods.id', 'foods.code', 'foods.name', 'foods.altNames', 'foods.englishName', 'foods.tags', 'foodAttributes.readyMealOption', 'foodAttributes.reasonableAmount', 'foodAttributes.sameAsBeforeOption', 'foodAttributes.useInRecipes', 'processedImages.path as thumbnailPath'])
      .where('foods.localeId', '=', localeId)
      .orderBy('foods.code', 'asc')
      .stream(this.dbBatchSize);

    const batchedStream = batchStream(foodsStream, this.dbBatchSize);

    for await (const batch of batchedStream) {
      const foodIds = batch.map(row => row.id);

      const parentCategories = await this.db
        .selectFrom('foodsCategories')
        .innerJoin('categories', 'categories.id', 'foodsCategories.categoryId')
        .select(['foodId', 'categories.code'])
        .where('foodsCategories.foodId', 'in', foodIds)
        .execute();

      const parentCategoryIndex = parentCategories.reduce<Record<string, string[]>>((acc, { foodId, code }) => {
        if (!acc[foodId])
          acc[foodId] = [];
        acc[foodId].push(code);
        return acc;
      }, {});

      const nutrientTableCodes = await this.db
        .selectFrom('foodsNutrients')
        .innerJoin('nutrientTableRecords', 'foodsNutrients.nutrientTableRecordId', 'nutrientTableRecords.id')
        .select(['foodsNutrients.foodId', 'nutrientTableRecords.nutrientTableId', 'nutrientTableRecords.nutrientTableRecordId'])
        .where('foodsNutrients.foodId', 'in', foodIds)
        .execute();

      const nutrientTableCodeIndex = nutrientTableCodes.reduce<Record<string, Record<string, string>>>((acc, { foodId, nutrientTableId, nutrientTableRecordId }) => {
        if (!acc[foodId])
          acc[foodId] = {};
        acc[foodId][nutrientTableId] = nutrientTableRecordId;
        return acc;
      }, {});

      const portionSizeMethods = await this.db
        .selectFrom('foodPortionSizeMethods')
        .select(['foodPortionSizeMethods.id', 'foodPortionSizeMethods.foodId', 'foodPortionSizeMethods.method', 'foodPortionSizeMethods.description', 'foodPortionSizeMethods.parameters', 'foodPortionSizeMethods.conversionFactor', 'foodPortionSizeMethods.useForRecipes'])
        .where('foodPortionSizeMethods.foodId', 'in', foodIds)
        .orderBy('foodPortionSizeMethods.orderBy', 'asc')
        .execute();

      const foodPortionSizeMethodsIndex = portionSizeMethods.reduce<Record<string, PkgV2PortionSizeMethod[]>>((acc, row) => {
        if (!acc[row.foodId])
          acc[row.foodId] = [];
        acc[row.foodId].push(packagePortionSize(row));
        return acc;
      }, {});

      const associatedFoods = await this.db
        .selectFrom('associatedFoods')
        .select(['associatedFoods.foodId', 'associatedFoods.associatedFoodCode', 'associatedFoods.associatedCategoryCode', 'associatedFoods.text', 'associatedFoods.genericName', 'associatedFoods.linkAsMain', 'associatedFoods.genericName', 'associatedFoods.multiple'])
        .where('associatedFoods.foodId', 'in', foodIds)
        .execute();

      const associatedFoodsIndex = associatedFoods.reduce<Record<string, PkgV2AssociatedFood[]>>((acc, row) => {
        if (!acc[row.foodId])
          acc[row.foodId] = [];

        acc[row.foodId].push ({
          genericName: localeTranslationStrict.parse(JSON.parse(row.genericName)),
          promptText: localeTranslationStrict.parse(JSON.parse(row.text)),
          linkAsMain: row.linkAsMain,
          categoryCode: row.associatedCategoryCode ?? undefined,
          foodCode: row.associatedFoodCode ?? undefined,
          multiple: row.multiple,
        });

        return acc;
      }, {});

      const brandNames = await this.db
        .selectFrom('brands')
        .select(['brands.foodId', 'brands.name'])
        .where('brands.foodId', 'in', foodIds)
        .execute();

      const brandNameIndex = brandNames.reduce<Record<string, string[]>>((acc, { foodId, name }) => {
        if (!acc[foodId])
          acc[foodId] = [];
        acc[foodId].push (name);
        return acc;
      }, {});

      for (const row of batch) {
        const foodRecord = {
          code: row.code,
          name: row.name ?? row.englishName,
          englishName: row.englishName,
          alternativeNames: JSON.parse(row.altNames),
          tags: JSON.parse(row.tags),
          attributes: {
            readyMealOption: row.readyMealOption ?? undefined,
            reasonableAmount: row.reasonableAmount ?? undefined,
            sameAsBeforeOption: row.sameAsBeforeOption ?? undefined,
            useInRecipes: row.useInRecipes ?? undefined,
          },
          parentCategories: parentCategoryIndex[row.id] ?? [],
          nutrientTableCodes: nutrientTableCodeIndex[row.id] ?? {},
          portionSize: foodPortionSizeMethodsIndex[row.id] ?? [],
          associatedFoods: associatedFoodsIndex[row.id] ?? [],
          brandNames: brandNameIndex[row.id] ?? [],
          thumbnailPath: row.thumbnailPath ?? undefined,
        };

        await this.packageWriter.writeFood(localeId, foodRecord);

        for (const psm of foodRecord.portionSize) {
          switch (psm.method) {
            case 'as-served':
              this.asServedSetIds.add(psm.servingImageSet);
              if (psm.leftoversImageSet !== undefined)
                this.asServedSetIds.add(psm.leftoversImageSet);
              break;
            default:
              break;
          }
        }

        ++foodsProcessed;
      }
      await this.updateProgress(localeId, 'foods', foodsProcessed / foodRecordCount);
    }
  }

  async processCategories(localeId: string): Promise<void> {
    const { count } = await this.db
      .selectFrom('categories')
      .select(this.db.fn.countAll().as('count'))
      .where('categories.localeId', '=', localeId)
      .executeTakeFirstOrThrow();

    const categoryRecordCount = Number(count);

    let categoriesProcessed = 0;

    const categoriesStream = this.db
      .selectFrom('categories')
      .leftJoin('categoryAttributes', 'categoryAttributes.categoryId', 'categories.id')
      .select(['categories.id', 'categories.code', 'categories.name', 'categories.englishName', 'categories.hidden', 'categoryAttributes.readyMealOption', 'categoryAttributes.reasonableAmount', 'categoryAttributes.sameAsBeforeOption', 'categoryAttributes.useInRecipes'])
      .where('categories.localeId', '=', localeId)
      .orderBy('categories.code', 'asc')
      .stream(this.dbBatchSize);

    const batchedStream = batchStream(categoriesStream, this.dbBatchSize);

    for await (const batch of batchedStream) {
      const categoryIds = batch.map(row => row.id);

      const parentCategories = await this.db
        .selectFrom('categoriesCategories')
        .innerJoin('categories', 'categories.id', 'categoriesCategories.categoryId')
        .select(['categoriesCategories.subCategoryId', 'categories.code'])
        .where('categoriesCategories.subCategoryId', 'in', categoryIds)
        .execute();

      const parentCategoryIndex = parentCategories.reduce<Record<string, string[]>>((acc, { subCategoryId, code }) => {
        if (!acc[subCategoryId])
          acc[subCategoryId] = [];
        acc[subCategoryId].push(code);
        return acc;
      }, {});

      const portionSizeMethods = await this.db
        .selectFrom('categoryPortionSizeMethods')
        .select(['categoryPortionSizeMethods.id', 'categoryPortionSizeMethods.categoryId', 'categoryPortionSizeMethods.method', 'categoryPortionSizeMethods.description', 'categoryPortionSizeMethods.parameters', 'categoryPortionSizeMethods.conversionFactor', 'categoryPortionSizeMethods.useForRecipes'])
        .where('categoryPortionSizeMethods.categoryId', 'in', categoryIds)
        .orderBy('categoryPortionSizeMethods.orderBy', 'asc')
        .execute();

      const categoryPortionSizeMethodsIndex = portionSizeMethods.reduce<Record<string, PkgV2PortionSizeMethod[]>>((acc, row) => {
        if (!acc[row.categoryId])
          acc[row.categoryId] = [];
        acc[row.categoryId].push(packagePortionSize(row));
        return acc;
      }, {});

      for (const row of batch) {
        const categoryRecord: PkgV2Category = {
          code: row.code,
          name: row.name ?? row.englishName,
          englishName: row.englishName,
          hidden: row.hidden,
          attributes: {
            readyMealOption: row.readyMealOption ?? undefined,
            reasonableAmount: row.reasonableAmount ?? undefined,
            sameAsBeforeOption: row.sameAsBeforeOption ?? undefined,
            useInRecipes: row.useInRecipes ?? undefined,
          },
          parentCategories: parentCategoryIndex[row.id] ?? [],
          portionSize: categoryPortionSizeMethodsIndex[row.id] ?? [],
        };

        await this.packageWriter.writeCategory(localeId, categoryRecord);

        for (const psm of categoryRecord.portionSize) {
          switch (psm.method) {
            case 'as-served':
              this.asServedSetIds.add(psm.servingImageSet);
              if (psm.leftoversImageSet !== undefined)
                this.asServedSetIds.add(psm.leftoversImageSet);
              break;
            default:
              break;
          }
        }

        ++categoriesProcessed;
      }
      await this.updateProgress(localeId, 'categories', categoriesProcessed / categoryRecordCount);
    }
  }

  /*
   collectUniqueAsServedSetIds(localeIds: string[]): Promise<Set<string>> {
    const uniqueIds: Set<string> = new Set();

    function processRow(row: { parameters: string }): void {
      const parsedParams = asServedPortionSizeParameters.parse(JSON.parse(row.parameters));

      uniqueIds.add(parsedParams.servingImageSet);

      if (parsedParams.leftoversImageSet !== undefined && parsedParams.leftoversImageSet !== null && !uniqueIds.has(parsedParams.leftoversImageSet)) {
        uniqueIds.add(parsedParams.leftoversImageSet);
      }
    }

    const foodParamsStream = kyselyDb.foods
      .selectFrom('foods')
      .innerJoin('foodPortionSizeMethods', 'foodPortionSizeMethods.foodId', 'foods.id')
      .select(['foodPortionSizeMethods.parameters'])
      .where('foods.localeId', 'in', localeIds)
      .where('foodPortionSizeMethods.method', '=', 'as-served')
      .orderBy('foods.code')
      .orderBy('foodPortionSizeMethods.orderBy')
      .stream(BATCH_SIZE);

    for await (const row of foodParamsStream) {
      processRow(row);
    }

    const categoryParamsStream = kyselyDb.foods
      .selectFrom('categories')
      .innerJoin('categoryPortionSizeMethods', 'categoryPortionSizeMethods.categoryId', 'categories.id')
      .select(['categoryPortionSizeMethods.parameters'])
      .where('categories.localeId', 'in', localeIds)
      .where('categoryPortionSizeMethods.method', '=', 'as-served')
      .orderBy('categories.code')
      .orderBy('categoryPortionSizeMethods.orderBy')
      .stream(BATCH_SIZE);

    for await (const row of categoryParamsStream) {
      processRow(row);
    }

    return uniqueIds;
  } */

  async processAsServedSets(): Promise<void> {
    const asServedSetsStream = this.db
      .selectFrom('asServedSets')
      .innerJoin('asServedImages', 'asServedImages.asServedSetId', 'asServedSets.id')
      .innerJoin('processedImages as pi_sel', 'pi_sel.id', 'asServedSets.selectionImageId')
      .innerJoin('sourceImages as si_sel', 'si_sel.id', 'pi_sel.sourceId')
      .innerJoin('processedImages as pi_asi', 'pi_asi.id', 'asServedImages.imageId')
      .innerJoin('sourceImages as si_asi', 'si_asi.id', 'pi_asi.sourceId')
      .select([
        'asServedSets.id',
        'asServedSets.label',
        'asServedSets.description',
        'si_sel.path as selectionImagePath',
        'asServedImages.label',
        'asServedImages.weight',
        'si_asi.id as sourceImageId',
        'si_asi.path as imagePath',
      ])
      .orderBy(sql`lower(${sql.ref('asServedSets.id')})`)
      .orderBy('asServedImages.weight')
      .where('asServedSets.id', 'in', [...this.asServedSetIds])
      .stream(this.dbBatchSize);

    for await (const batch of batchStreamGrouped(asServedSetsStream, row => row.id, this.dbBatchSize)) {
      const sourceImageIds = Object.values(batch).flatMap(rows => rows.map(row => row.sourceImageId));

      const keywordRows = await this.db
        .selectFrom('sourceImageKeywords')
        .select(['sourceImageId', 'keyword'])
        .where('sourceImageKeywords.sourceImageId', 'in', sourceImageIds)
        .execute();

      const keywords = mapValues(groupBy(keywordRows, row => row.sourceImageId), rows => rows.map(row => row.keyword));

      for (const [id, rows] of Object.entries(batch)) {
        const first = rows[0];

        const asServedSetRecord = {
          id,
          description: first.description,
          selectionImagePath: first.selectionImagePath,
          label: first.label ? JSON.parse(first.label) : undefined,
          images: rows.map((imageRow: any) => ({
            weight: imageRow.weight,
            imagePath: imageRow.imagePath,
            imageKeywords: keywords[imageRow.sourceImageId] ?? [],
            label: imageRow.label == null ? undefined : localeTranslationStrict.parse(JSON.parse(imageRow.label)),
          })),
        };

        this.packageWriter.writeAsServedSet(asServedSetRecord);

        this.imageFilePaths.add(first.selectionImagePath);
        for (const image of asServedSetRecord.images) {
          this.imageFilePaths.add(image.imagePath);
        }
      }
    }
  }
  /*

  async function* streamAsServedImagePaths(asServedSetIds: string[]): AsyncIterable<PkgV2AsServedSet> {
    const asServedSetsStream = kyselyDb.foods
      .selectFrom('asServedSets')
      .innerJoin('asServedImages', 'asServedImages.asServedSetId', 'asServedSets.id')
      .innerJoin('processedImages as pi_sel', 'pi_sel.id', 'asServedSets.selectionImageId')
      .innerJoin('sourceImages as si_sel', 'si_sel.id', 'pi_sel.sourceId')
      .innerJoin('processedImages as pi_asi', 'pi_asi.id', 'asServedImages.imageId')
      .innerJoin('sourceImages as si_asi', 'si_asi.id', 'pi_asi.sourceId')
      .select([
        'asServedSets.id',
        'asServedSets.label',
        'asServedSets.description',
        'si_sel.path as selectionImagePath',
        'asServedImages.label',
        'asServedImages.weight',
        'si_asi.id as sourceImageId',
        'si_asi.path as imagePath',
      ])
      .orderBy(sql`lower(${sql.ref('asServedSets.id')})`)
      .orderBy('asServedImages.weight')
      .where('asServedSets.id', 'in', asServedSetIds)
      .stream(BATCH_SIZE);

    for await (const batch of batchStreamGrouped(asServedSetsStream, row => row.id, BATCH_SIZE)) {
      const sourceImageIds = Object.values(batch).flatMap(rows => rows.map(row => row.sourceImageId));

      const keywordRows = await kyselyDb.foods
        .selectFrom('sourceImageKeywords')
        .select(['sourceImageId', 'keyword'])
        .where('sourceImageKeywords.sourceImageId', 'in', sourceImageIds)
        .execute();

      const keywords = mapValues(groupBy(keywordRows, row => row.sourceImageId), rows => rows.map(row => row.keyword));

      for (const [id, rows] of Object.entries(batch)) {
        const first = rows[0];

        yield {
          id,
          description: first.description,
          selectionImagePath: first.selectionImagePath,
          label: first.label ? JSON.parse(first.label) : undefined,
          images: rows.map((imageRow: any) => ({
            weight: imageRow.weight,
            imagePath: imageRow.imagePath,
            imageKeywords: keywords[imageRow.sourceImageId] ?? [],
            label: imageRow.label == null ? undefined : localeTranslationStrict.parse(JSON.parse(imageRow.label)),
          })),
        };
      }
    }
  } */

  getOverallProgress(): number {
    if (this.exportOptions.locales.length === 0 || this.exportOptions.options.include.length === 0)
      return 1;

    const totalOptionsWeight = this.exportOptions.options.include.reduce(
      (sum, stage) => sum + progressWeights[stage],
      0,
    );

    let completedWeight = 0;

    for (const localeId of this.exportOptions.locales) {
      const localeProgress = this.progress.get(localeId);

      for (const option of this.exportOptions.options.include) {
        const progress = Math.max(0, Math.min(1, localeProgress?.get(option) ?? 0));
        const optionWeight = progressWeights[option];
        const normalizedWeight = optionWeight / totalOptionsWeight;
        completedWeight += normalizedWeight * progress;
      }
    }

    return completedWeight / this.exportOptions.locales.length;
  }

  async updateProgress(localeId: string, option: PackageIncludeOption, progress: number) {
    let localeProgress = this.progress.get(localeId);

    if (localeProgress === undefined) {
      localeProgress = new Map<PackageIncludeOption, number>();
      this.progress.set(localeId, localeProgress);
    }

    localeProgress.set(option, progress);

    const overallProgress = this.getOverallProgress();

    await this.updateProgressCallback(overallProgress);
  }

  include(option: PackageIncludeOption): boolean {
    return this.exportOptions.options.include.includes(option);
  }

  async export(): Promise<void> {
    for (const localeId of this.exportOptions.locales) {
      if (this.include('foods'))
        await this.processFoods(localeId);
      if (this.include('categories'))
        await this.processCategories(localeId);
    }

    if (this.asServedSetIds.size > 0) {
      await this.processAsServedSets();
    }

    await this.packageWriter.finish();

    if (this.imageFilePaths.size > 0) {
      for (const path of this.imageFilePaths) {
        await this.copyImage(path);
      }
    }

    await this.updateProgressCallback(1);
  }
}
