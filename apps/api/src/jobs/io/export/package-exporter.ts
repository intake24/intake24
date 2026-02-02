import type { Kysely } from 'kysely';

import type { PackageWriter } from './types';
import type { PackageExportOptions, PackageIncludeOption } from '@intake24/common/types/http/admin';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkScale, PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
import type { PkgV2AssociatedFood, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';
import type { PkgV2GuideImage } from '@intake24/common/types/package/guide-image';
import type { PkgV2ImageMap, PkgV2ImageMapObject } from '@intake24/common/types/package/image-map';
import type { FoodsDB } from '@intake24/db/kysely';

import fs from 'node:fs/promises';
import path from 'node:path';

import { sql } from 'kysely';
import { groupBy, mapValues } from 'lodash-es';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { pkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import { pkgV2AssociatedFood, pkgV2Food } from '@intake24/common/types/package/foods';
import { pkgV2Locale } from '@intake24/common/types/package/locale';

import { packagePortionSize } from './type-conversions';

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
  foods: 0.35,
  categories: 0.10,
  locales: 0.05,
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
  private globalProgress: Map<PackageIncludeOption, number>;
  private asServedSetIds: Set<string>;
  private guideImageIds: Set<string>;
  private drinkwareSetIds: Set<string>;
  private imageMapIds: Set<string>;
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
    this.guideImageIds = new Set<string>();
    this.drinkwareSetIds = new Set<string>();
    this.imageMapIds = new Set<string>();
    this.imageFilePaths = new Set<string>();
    this.progress = new Map<string, Map<PackageIncludeOption, number>>();
    this.globalProgress = new Map<PackageIncludeOption, number>();
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
        .select(['foodPortionSizeMethods.id', 'foodPortionSizeMethods.foodId', 'foodPortionSizeMethods.method', 'foodPortionSizeMethods.description', 'foodPortionSizeMethods.parameters', 'foodPortionSizeMethods.conversionFactor', 'foodPortionSizeMethods.pathways', 'foodPortionSizeMethods.defaultWeight', 'foodPortionSizeMethods.orderBy'])
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
        .select(['associatedFoods.foodId', 'associatedFoods.associatedFoodCode', 'associatedFoods.associatedCategoryCode', 'associatedFoods.text', 'associatedFoods.genericName', 'associatedFoods.linkAsMain', 'associatedFoods.genericName', 'associatedFoods.multiple', 'associatedFoods.orderBy'])
        .where('associatedFoods.foodId', 'in', foodIds)
        .orderBy('associatedFoods.orderBy', 'asc')
        .execute();

      const associatedFoodsIndex = associatedFoods.reduce<Record<string, PkgV2AssociatedFood[]>>((acc, row) => {
        if (!acc[row.foodId])
          acc[row.foodId] = [];

        try {
          const assocFoodRecord = {
            genericName: row.genericName,
            promptText: row.text,
            linkAsMain: row.linkAsMain,
            categoryCode: row.associatedCategoryCode ?? undefined,
            foodCode: row.associatedFoodCode ?? undefined,
            multiple: row.multiple,
            orderBy: row.orderBy,
          };

          acc[row.foodId].push (pkgV2AssociatedFood.parse(assocFoodRecord));
        }
        catch (err) {
          if (err instanceof ZodError) {
            throw new Error(`Associated food validation failed for food ${row.foodId} (locale: ${localeId}): ${fromZodError(err).toString()}`, { cause: err });
          }
          throw err;
        }

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
          alternativeNames: row.altNames,
          tags: row.tags,
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

        try {
          await this.packageWriter.writeFood(localeId, pkgV2Food.parse(foodRecord));
        }
        catch (err) {
          if (err instanceof ZodError) {
            throw new Error(`Validation failed for food ${row.code} (locale: ${localeId}): ${fromZodError(err).toString()}`, { cause: err });
          }
          throw err;
        }

        for (const psm of foodRecord.portionSize) {
          switch (psm.method) {
            case 'as-served':
              this.asServedSetIds.add(psm.servingImageSet);
              if (psm.leftoversImageSet !== undefined)
                this.asServedSetIds.add(psm.leftoversImageSet);
              break;
            case 'guide-image':
              this.guideImageIds.add(psm.guideImageId);
              break;
            case 'drink-scale':
              this.drinkwareSetIds.add(psm.drinkwareId);
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
        .select(['categoryPortionSizeMethods.id', 'categoryPortionSizeMethods.categoryId', 'categoryPortionSizeMethods.method', 'categoryPortionSizeMethods.description', 'categoryPortionSizeMethods.parameters', 'categoryPortionSizeMethods.conversionFactor', 'categoryPortionSizeMethods.pathways', 'categoryPortionSizeMethods.defaultWeight', 'orderBy'])
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
            useInRecipes: (row.useInRecipes as 0 | 1 | 2 | null) ?? undefined,
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
            case 'guide-image':
              this.guideImageIds.add(psm.guideImageId);
              break;
            case 'drink-scale':
              this.drinkwareSetIds.add(psm.drinkwareId);
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

  async processLocale(localeId: string): Promise<void> {
    const localeRecord = await this.db
      .selectFrom('locales')
      .select([
        'id',
        'englishName',
        'localName',
        'respondentLanguageId',
        'adminLanguageId',
        'countryFlagCode',
        'textDirection',
        'foodIndexLanguageBackendId',
      ])
      .where('id', '=', localeId)
      .executeTakeFirstOrThrow();

    const pkgLocale = {
      id: localeRecord.id,
      englishName: localeRecord.englishName,
      localName: localeRecord.localName,
      respondentLanguage: localeRecord.respondentLanguageId,
      adminLanguage: localeRecord.adminLanguageId,
      flagCode: localeRecord.countryFlagCode,
      textDirection: localeRecord.textDirection,
      foodIndexLanguageBackendId: localeRecord.foodIndexLanguageBackendId,
    };

    try {
      await this.packageWriter.writeLocale(pkgV2Locale.parse(pkgLocale));
    }
    catch (err) {
      if (err instanceof ZodError) {
        throw new Error(`Validation failed for locale ${localeId}: ${fromZodError(err).toString()}`, { cause: err });
      }
      throw err;
    }

    await this.updateProgress(localeId, 'locales', 1);
  }

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

      for (const [_, rows] of Object.entries(batch)) {
        const first = rows[0];

        const asServedSetRecord = {
          id: first.id,
          description: first.description,
          selectionImagePath: first.selectionImagePath,
          label: first.label,
          images: rows.map((imageRow: any) => ({
            weight: imageRow.weight,
            imagePath: imageRow.imagePath,
            imageKeywords: keywords[imageRow.sourceImageId] ?? [],
            label: imageRow.label,
          })),
        };

        try {
          const validatedSet = pkgV2AsServedSet.parse(asServedSetRecord);

          this.packageWriter.writeAsServedSet(validatedSet);

          this.imageFilePaths.add(validatedSet.selectionImagePath);
          for (const image of validatedSet.images) {
            this.imageFilePaths.add(image.imagePath);
          }
        }
        catch (err) {
          if (err instanceof ZodError) {
            throw new Error(`As served set validation failed for set ${first.id}: ${fromZodError(err).toString()}`, { cause: err });
          }
          throw err;
        }
      }
    }
  }

  async processImageMaps(imageMapIds: Set<string>): Promise<void> {
    if (imageMapIds.size === 0)
      return;

    const imageMapsStream = this.db
      .selectFrom('imageMaps')
      .innerJoin('sourceImages', 'sourceImages.id', 'imageMaps.baseImageId')
      .select([
        'imageMaps.id',
        'imageMaps.description',
        'sourceImages.path as baseImagePath',
      ])
      .where('imageMaps.id', 'in', [...imageMapIds])
      .orderBy(sql`lower(${sql.ref('imageMaps.id')})`)
      .stream(this.dbBatchSize);

    for await (const batch of batchStream(imageMapsStream, this.dbBatchSize)) {
      const mapIds = batch.map(row => row.id);

      const objectRows = await this.db
        .selectFrom('imageMapObjects')
        .select([
          'imageMapObjects.imageMapId',
          'imageMapObjects.id',
          'imageMapObjects.description',
          'imageMapObjects.navigationIndex',
          'imageMapObjects.outlineCoordinates',
        ])
        .where('imageMapObjects.imageMapId', 'in', mapIds)
        .execute();

      const objectsByMapId = groupBy(objectRows, row => row.imageMapId);

      for (const row of batch) {
        const objects: Record<number, PkgV2ImageMapObject> = {};
        for (const obj of objectsByMapId[row.id] ?? []) {
          objects[Number(obj.id)] = {
            description: obj.description,
            navigationIndex: obj.navigationIndex,
            outlineCoordinates: obj.outlineCoordinates as number[],
          };
        }

        const imageMapRecord: PkgV2ImageMap = {
          id: row.id,
          description: row.description,
          baseImagePath: row.baseImagePath,
          objects,
        };

        await this.packageWriter.writeImageMap(imageMapRecord);
        this.imageFilePaths.add(row.baseImagePath);
      }
    }
  }

  async processGuideImages(): Promise<void> {
    if (this.guideImageIds.size === 0)
      return;

    const guideImagesStream = this.db
      .selectFrom('guideImages')
      .select([
        'guideImages.id',
        'guideImages.description',
        'guideImages.imageMapId',
        'guideImages.label',
      ])
      .where('guideImages.id', 'in', [...this.guideImageIds])
      .orderBy(sql`lower(${sql.ref('guideImages.id')})`)
      .stream(this.dbBatchSize);

    for await (const batch of batchStream(guideImagesStream, this.dbBatchSize)) {
      const guideImageIds = batch.map(row => row.id);

      const objectRows = await this.db
        .selectFrom('guideImageObjects')
        .select([
          'guideImageObjects.guideImageId',
          'guideImageObjects.imageMapObjectId',
          'guideImageObjects.weight',
        ])
        .where('guideImageObjects.guideImageId', 'in', guideImageIds)
        .execute();

      const objectsByGuideImageId = groupBy(objectRows, row => row.guideImageId);

      for (const row of batch) {
        const objectWeights: Record<number, number> = {};
        for (const obj of objectsByGuideImageId[row.id] ?? []) {
          objectWeights[Number(obj.imageMapObjectId)] = obj.weight;
        }

        const guideImageRecord: PkgV2GuideImage = {
          id: row.id,
          description: row.description,
          imageMapId: row.imageMapId,
          objectWeights,
          label: row.label as Record<string, string> | undefined,
        };

        await this.packageWriter.writeGuideImage(guideImageRecord);

        // Save image map ID for later processing
        this.imageMapIds.add(row.imageMapId);
      }
    }
  }

  async processDrinkwareSets(): Promise<void> {
    if (this.drinkwareSetIds.size === 0)
      return;

    const drinkwareSetsStream = this.db
      .selectFrom('drinkwareSets')
      .select([
        'drinkwareSets.id',
        'drinkwareSets.description',
        'drinkwareSets.imageMapId',
        'drinkwareSets.label',
      ])
      .where('drinkwareSets.id', 'in', [...this.drinkwareSetIds])
      .orderBy(sql`lower(${sql.ref('drinkwareSets.id')})`)
      .stream(this.dbBatchSize);

    for await (const batch of batchStream(drinkwareSetsStream, this.dbBatchSize)) {
      const setIds = batch.map(row => row.id);

      const v1ScaleRows = await this.db
        .selectFrom('drinkwareScales')
        .innerJoin('drinkwareVolumeSamples', 'drinkwareVolumeSamples.drinkwareScaleId', 'drinkwareScales.id')
        .select([
          'drinkwareScales.drinkwareSetId',
          'drinkwareScales.choiceId',
          'drinkwareScales.label',
          'drinkwareScales.width',
          'drinkwareScales.height',
          'drinkwareScales.emptyLevel',
          'drinkwareScales.fullLevel',
          'drinkwareScales.baseImageUrl',
          'drinkwareScales.overlayImageUrl',
          'drinkwareVolumeSamples.fill',
          'drinkwareVolumeSamples.volume',
        ])
        .where('drinkwareScales.drinkwareSetId', 'in', setIds)
        .orderBy('drinkwareScales.choiceId')
        .orderBy('drinkwareVolumeSamples.fill')
        .execute();

      const v1ScalesBySetId = groupBy(v1ScaleRows, row => row.drinkwareSetId);

      const v2ScaleRows = await this.db
        .selectFrom('drinkwareScalesV2')
        .innerJoin('sourceImages', 'sourceImages.id', 'drinkwareScalesV2.baseImageId')
        .select([
          'drinkwareScalesV2.drinkwareSetId',
          'drinkwareScalesV2.choiceId',
          'drinkwareScalesV2.label',
          'drinkwareScalesV2.outlineCoordinates',
          'drinkwareScalesV2.volumeMethod',
          'drinkwareScalesV2.volumeSamples',
          'sourceImages.path as baseImagePath',
        ])
        .where('drinkwareScalesV2.drinkwareSetId', 'in', setIds)
        .execute();

      const v2ScalesBySetId = groupBy(v2ScaleRows, row => row.drinkwareSetId);

      for (const row of batch) {
        const scales: Record<number, PkgV2DrinkScale> = {};

        const v1Scales = v1ScalesBySetId[row.id] ?? [];
        const v1ScalesByChoiceId = groupBy(v1Scales, r => r.choiceId.toString());
        for (const [choiceId, scaleRows] of Object.entries(v1ScalesByChoiceId)) {
          const first = scaleRows[0];
          const volumeSamples = scaleRows.map(r => r.volume);
          scales[Number(choiceId)] = {
            version: 1,
            label: (first.label as any)?.en ?? '',
            width: first.width,
            height: first.height,
            emptyLevel: first.emptyLevel,
            fullLevel: first.fullLevel,
            baseImagePath: first.baseImageUrl,
            overlayImagePath: first.overlayImageUrl,
            volumeSamples,
          };
          this.imageFilePaths.add(first.baseImageUrl);
          this.imageFilePaths.add(first.overlayImageUrl);
        }

        for (const v2Scale of v2ScalesBySetId[row.id] ?? []) {
          scales[Number(v2Scale.choiceId)] = {
            version: 2,
            label: v2Scale.label as Record<string, string>,
            baseImagePath: v2Scale.baseImagePath,
            outlineCoordinates: v2Scale.outlineCoordinates as number[],
            volumeSamples: v2Scale.volumeSamples as number[],
            volumeMethod: v2Scale.volumeMethod as 'lookUpTable' | 'cylindrical',
          };
          this.imageFilePaths.add(v2Scale.baseImagePath);
        }

        const drinkwareSetRecord: PkgV2DrinkwareSet = {
          id: row.id,
          description: row.description,
          selectionImageMapId: row.imageMapId,
          scales,
          label: row.label as Record<string, string> | undefined,
        };

        await this.packageWriter.writeDrinkwareSet(drinkwareSetRecord);

        // Save image map ID for later processing
        this.imageMapIds.add(row.imageMapId);
      }
    }
  }

  getOverallProgress(): number {
    if (this.exportOptions.locales.length === 0 || this.exportOptions.options.include.length === 0)
      return 1;

    const localeDependentOptions: PackageIncludeOption[] = ['foods', 'categories', 'locales'];
    const globalOptions: PackageIncludeOption[] = ['portionSizeMethods', 'portionSizeImages'];

    const includedLocaleOptions = this.exportOptions.options.include.filter(opt => localeDependentOptions.includes(opt));
    const includedGlobalOptions = this.exportOptions.options.include.filter(opt => globalOptions.includes(opt));

    const totalOptionsWeight = this.exportOptions.options.include.reduce(
      (sum, stage) => sum + progressWeights[stage],
      0,
    );

    let completedWeight = 0;

    // Locale-dependent progress (foods, categories)
    if (includedLocaleOptions.length > 0) {
      for (const localeId of this.exportOptions.locales) {
        const localeProgress = this.progress.get(localeId);

        for (const option of includedLocaleOptions) {
          const progress = Math.max(0, Math.min(1, localeProgress?.get(option) ?? 0));
          const optionWeight = progressWeights[option];
          const normalizedWeight = optionWeight / totalOptionsWeight;
          completedWeight += normalizedWeight * progress / this.exportOptions.locales.length;
        }
      }
    }

    // Global progress (portionSizeMethods, portionSizeImages)
    for (const option of includedGlobalOptions) {
      const progress = Math.max(0, Math.min(1, this.globalProgress.get(option) ?? 0));
      const optionWeight = progressWeights[option];
      const normalizedWeight = optionWeight / totalOptionsWeight;
      completedWeight += normalizedWeight * progress;
    }

    return completedWeight;
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

  async updateGlobalProgress(option: PackageIncludeOption, progress: number) {
    this.globalProgress.set(option, progress);
    const overallProgress = this.getOverallProgress();
    await this.updateProgressCallback(overallProgress);
  }

  include(option: PackageIncludeOption): boolean {
    return this.exportOptions.options.include.includes(option);
  }

  async export(): Promise<void> {
    for (const localeId of this.exportOptions.locales) {
      if (this.include('locales'))
        await this.processLocale(localeId);
      if (this.include('foods'))
        await this.processFoods(localeId);
      if (this.include('categories'))
        await this.processCategories(localeId);
    }

    if (this.include('portionSizeMethods')) {
      // Count total portion size items for progress tracking
      const totalPortionSizeItems = this.asServedSetIds.size + this.guideImageIds.size + this.drinkwareSetIds.size;
      let processedPortionSizeItems = 0;

      if (this.asServedSetIds.size > 0) {
        await this.processAsServedSets();
        processedPortionSizeItems += this.asServedSetIds.size;
        await this.updateGlobalProgress('portionSizeMethods', totalPortionSizeItems > 0 ? processedPortionSizeItems / totalPortionSizeItems : 1);
      }

      if (this.guideImageIds.size > 0) {
        await this.processGuideImages();
        processedPortionSizeItems += this.guideImageIds.size;
        await this.updateGlobalProgress('portionSizeMethods', totalPortionSizeItems > 0 ? processedPortionSizeItems / totalPortionSizeItems : 1);
      }

      if (this.drinkwareSetIds.size > 0) {
        await this.processDrinkwareSets();
        processedPortionSizeItems += this.drinkwareSetIds.size;
        await this.updateGlobalProgress('portionSizeMethods', totalPortionSizeItems > 0 ? processedPortionSizeItems / totalPortionSizeItems : 1);
      }

      // Process image maps last (collected from guide images and drinkware)
      if (this.imageMapIds.size > 0) {
        await this.processImageMaps(this.imageMapIds);
      }

      // Mark portion size methods as complete
      await this.updateGlobalProgress('portionSizeMethods', 1);
    }

    await this.packageWriter.finish();

    const packageJson = {
      version: '2.0',
      format: this.exportOptions.format,
    };

    await fs.writeFile(path.join(this.outputPath, 'package.json'), JSON.stringify(packageJson, null, 2));

    if (this.include('portionSizeImages') && this.imageFilePaths.size > 0) {
      const totalImages = this.imageFilePaths.size;
      let copiedImages = 0;

      for (const path of this.imageFilePaths) {
        await this.copyImage(path);
        copiedImages++;
        // Update progress every 10 images to avoid too many updates
        if (copiedImages % 10 === 0 || copiedImages === totalImages) {
          await this.updateGlobalProgress('portionSizeImages', copiedImages / totalImages);
        }
      }
    }

    await this.updateProgressCallback(1);
  }
}
