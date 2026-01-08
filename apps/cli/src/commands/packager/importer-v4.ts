import fs, { constants } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import decompress from 'decompress';
import { omit } from 'lodash-es';
import type { ApiClientV4, DrinkwareScaleUpdate } from '@intake24/api-client-v4';
import { PkgConstants } from '@intake24/cli/commands/packager/constants';
import type {
  PkgAsServedImage,
  PkgAsServedSet,
} from '@intake24/cli/commands/packager/types/as-served';
import type {
  PkgCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type {
  PkgDrinkScale,
  PkgDrinkwareSet,
} from '@intake24/cli/commands/packager/types/drinkware';
import type { PkgFood } from '@intake24/cli/commands/packager/types/foods';
import { PkgGuideImage } from '@intake24/cli/commands/packager/types/guide-image';
import type { PkgImageMap } from '@intake24/cli/commands/packager/types/image-map';
import type { PkgLocale } from '@intake24/cli/commands/packager/types/locale';
import type { PkgNutrientTable } from '@intake24/cli/commands/packager/types/nutrient-tables';
import logger from '@intake24/common-backend/services/logger/logger';
import { Dictionary } from '@intake24/common/types';
import { PkgPortionSizeImageLabels } from './types/portion-size-image-labels';
import typeConverters from './types/v4-type-conversions';

export type Logger = typeof logger;

export const conflictResolutionOptions = ['skip', 'overwrite', 'abort'] as const;
export const importerSpecificModulesExecutionOptions = [
  'as-served-images',
  'verify-as-served',
  'image-maps',
  'guide-images',
  'drinkware-sets',
  'locales',
  'nutrients',
  'verify-local-foods',
  'foods',
  'categories',
  'image-labels',
  'all',
] as const;

export type ConflictResolutionStrategy = (typeof conflictResolutionOptions)[number];
export type ImporterSpecificModulesExecutionStrategy
  = (typeof importerSpecificModulesExecutionOptions)[number];

export interface ImporterOptions {
  onConflict?: ConflictResolutionStrategy;
  modulesForExecution?: ImporterSpecificModulesExecutionStrategy[];
  append: boolean;
  asServedIds?: string[];
  foodIds?: string[];
}

export type availableModules = {
  [key in ImporterSpecificModulesExecutionStrategy]: () => Promise<void>;
};

const defaultOptions: ImporterOptions = {
  onConflict: 'abort',
  modulesForExecution: ['all'],
  append: false,
};

export class ImporterV4 {
  private readonly inputFilePath: string;

  private readonly apiClient: ApiClientV4;
  private readonly logger: Logger;
  private readonly options: ImporterOptions;

  private packageDirPath: string | undefined;
  private imageDirPath: string | undefined;

  private compressedPackage: boolean = false;

  private locales: PkgLocale[] | undefined;
  private localFoods: Record<string, PkgFood[]> | undefined;
  private enabledLocalFoods: Record<string, string[]> | undefined;
  private localCategories: Record<string, PkgCategory[]> | undefined;
  private nutrientTables: PkgNutrientTable[] | undefined;
  private asServedSets: PkgAsServedSet[] | undefined;
  private drinkwareSets: Record<string, PkgDrinkwareSet> | undefined;
  private imageMaps: Record<string, PkgImageMap> | undefined;
  private guideImages: Record<string, PkgGuideImage> | undefined;
  private portionSizeImageLabels: PkgPortionSizeImageLabels | undefined;

  constructor(
    apiClient: ApiClientV4,
    logger: Logger,
    inputFilePath: string,
    options?: Partial<ImporterOptions>,
  ) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.inputFilePath = inputFilePath;
    this.options = {
      onConflict: options?.onConflict ?? defaultOptions.onConflict,
      append: options?.append ?? defaultOptions.append,
      modulesForExecution:
        options
        && options.modulesForExecution !== undefined
        && options.modulesForExecution.length !== 0
          ? options.modulesForExecution
          : defaultOptions.modulesForExecution,
      asServedIds: options?.asServedIds,
      foodIds: options?.foodIds,
    };
  }

  // LIST of avaialble modules. Keep up to date
  private availableModules: availableModules = {
    locales: async () => {
      await this.readLocales();
      await this.importLocales();
    },
    nutrients: async () => {
      await this.readNutrientTables();
      await this.importNutrientTables();
    },
    'as-served-images': async () => {
      await this.readAsServedSets();
      await this.importAsServedSets();
    },
    'verify-as-served': async () => {
      await this.readAsServedSets();
      await this.verifyAsServedImages();
    },
    'image-maps': async () => {
      await this.readImageMaps();
      await this.importImageMaps();
    },
    'guide-images': async () => {
      await this.readGuideImages();
      await this.importGuideImages();
    },
    categories: async () => {
      await this.readCategories();
      await this.importCategories();
    },
    foods: async () => {
      await this.readFoods();
      await this.importFoods();
    },
    'verify-local-foods': async () => {
      await this.readFoods();
      await this.verifyPortionSizeImages();
    },
    'drinkware-sets': async () => {
      await this.readDrinkwareSets();
      await this.importDrinkwareSets();
    },
    'image-labels': async () => {
      await this.readPortionSizeImageLabels();
      await this.importPortionSizeImageLabels();
    },
    all: async () => {
      await this.readPackage();
      await this.importLocales();
      await this.importNutrientTables();
      await this.importAsServedSets();
      await this.importImageMaps();
      await this.importDrinkwareSets();
      await this.importCategories();
      await this.importFoods();
    },
  };

  private async batchOperation<T>(
    objects: T[],
    batchSize: number,
    importFn: (object: T) => Promise<void>,
  ) {
    const objectCount = objects.length;

    logger.info(`Processing ${objectCount} objects...`);

    let importedCount = 0;

    for (let i = 0; i < objectCount; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const ops = batch.map(obj => importFn(obj));

      await Promise.all(ops);

      importedCount += batch.length;

      if (importedCount < objectCount)
        logger.info(`  ${importedCount}/${objectCount} complete...`);
    }

    logger.info('Finished');
  }

  private async batchImport<T>(
    objects: T[],
    objectName: string,
    batchSize: number,
    importFn: (object: T) => Promise<void>,
  ) {
    const objectCount = objects.length;

    logger.info(`Importing ${objectCount} ${objectName}(s)...`);

    let importedCount = 0;

    for (let i = 0; i < objectCount; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const ops = batch.map(obj => importFn(obj));

      await Promise.all(ops);

      importedCount += batch.length;

      if (importedCount < objectCount)
        logger.info(`  ${importedCount}/${objectCount} imported...`);
    }

    logger.info(`Finished importing ${objectName}(s).`);
  }

  private async batchImportRecord<T>(
    objects: Record<string, T>,
    objectName: string,
    batchSize: number,
    importFn: (id: string, object: T) => Promise<void>,
  ) {
    const entries = Object.entries(objects);
    const objectCount = entries.length;

    logger.info(`Importing ${objectCount} ${objectName}(s)...`);

    let importedCount = 0;

    for (let i = 0; i < objectCount; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const ops = batch.map(([id, obj]) => importFn(id, obj));

      await Promise.all(ops);

      importedCount += batch.length;

      if (importedCount < objectCount)
        logger.info(`  ${importedCount}/${objectCount} imported...`);
    }

    logger.info(`Finished importing ${objectName}(s).`);
  }

  private async importImageMap(imageMapId: string, imageMap: PkgImageMap): Promise<void> {
    const existing = await this.apiClient.portionSize.imageMaps.get(imageMapId);

    if (existing !== null) {
      switch (this.options.onConflict) {
        case 'skip':
          logger.info(`Image map already exists, skipping: ${imageMapId}`);
          return Promise.resolve();
        case 'abort': {
          const message = `Image map already exists: ${imageMapId}`;
          logger.error(message);
          return Promise.reject(new Error(message));
        }
        case 'overwrite': {
          logger.debug(`Updating existing image map: ${imageMapId}`);
          const objects = typeConverters.fromPackageImageMapObjects(imageMap.objects);

          await this.apiClient.portionSize.imageMaps.update(
            imageMapId,
            imageMap.description,
            objects,
          );

          await this.apiClient.portionSize.imageMaps.updateImage(
            imageMapId,
            path.join(this.imageDirPath!, imageMap.baseImagePath),
          );

          break;
        }
      }
    }
    else {
      logger.info(`Creating new image map: ${imageMapId}`);
      const objects = typeConverters.fromPackageImageMapObjects(imageMap.objects);

      await this.apiClient.portionSize.imageMaps.create(
        imageMapId,
        imageMap.description,
        path.join(this.imageDirPath!, imageMap.baseImagePath),
        objects,
      );
    }
  }

  private async importImageMaps(): Promise<void> {
    if (this.imageMaps !== undefined) {
      await this.batchImportRecord(this.imageMaps, 'image map', 10, (id, obj) =>
        this.importImageMap(id, obj));
    }
  }

  private async importGuideImage(guideImageId: string, guideImage: PkgGuideImage): Promise<void> {
    const existing = await this.apiClient.portionSize.guideImages.get(guideImageId);

    if (existing !== null) {
      switch (this.options.onConflict) {
        case 'skip':
          logger.info(`Guide image already exists, skipping: ${guideImageId}`);
          return Promise.resolve();
        case 'abort': {
          const message = `Guide image already exists: ${guideImageId}`;
          logger.error(message);
          return Promise.reject(new Error(message));
        }
        case 'overwrite': {
          logger.debug(`Updating existing guide image: ${guideImageId}`);
          const objects = typeConverters.fromPackageGuideImageObjects(guideImage.objectWeights);

          await this.apiClient.portionSize.guideImages.update(
            guideImageId,
            existing.description,
            objects,
          );

          break;
        }
      }
    }
    else {
      logger.info(`Creating new guide image: ${guideImageId}`);
      const objects = typeConverters.fromPackageGuideImageObjects(guideImage.objectWeights);

      await this.apiClient.portionSize.guideImages.create(
        guideImageId,
        guideImage.description,
        guideImage.imageMapId,
        guideImage.label,
      );

      await this.apiClient.portionSize.guideImages.update(
        guideImageId,
        guideImage.description,
        objects,
        guideImage.label,
      );
    }
  }

  private async importGuideImages(): Promise<void> {
    if (this.guideImages !== undefined) {
      await this.batchImportRecord(this.guideImages, 'guide image', 10, (id, obj) =>
        this.importGuideImage(id, obj));
    }
  }

  private async updateAsServedSetImages(setId: string, images: PkgAsServedImage[]): Promise<void> {
    logger.debug(`Updating images for as served set ${setId}`);

    logger.debug('Deleting existing images');
    await this.apiClient.portionSize.asServed.deleteAllImages(setId);

    logger.debug(`Uploading ${images.length} new images`);

    const ops = images.map(image =>
      this.apiClient.portionSize.asServed.uploadImage(
        setId,
        image.weight,
        path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, image.imagePath),
      ),
    );

    await Promise.all(ops);
  }

  private async importAsServedSet(pkgSet: PkgAsServedSet): Promise<void> {
    const setId = pkgSet.id;

    if (pkgSet.images.length === 0) {
      logger.warn(`As served set ${setId} has no images, skipping`);
      return;
    }
    else {
      logger.info(`Importing as served set: ${setId}`);
    }

    const existingSet = await this.apiClient.portionSize.asServed.get(setId);

    if (existingSet === null) {
      logger.debug(`Creating new as served set: ${setId}`);

      const middleImageIndex = Math.floor(pkgSet.images.length / 2);
      const selectionImagePath = pkgSet.images[middleImageIndex].imagePath;

      const createResult = await this.apiClient.portionSize.asServed.create(
        setId,
        pkgSet.description,
        path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, selectionImagePath),
        pkgSet.label,
      );

      switch (createResult.type) {
        case 'success':
          break;
        case 'conflict':
          throw new Error(`Failed to create as served set ${setId} due to a race condition`);
      }
    }
    else {
      switch (this.options.onConflict) {
        case 'skip':
          logger.debug(`As served set already exists, skipping: ${setId}`);
          return Promise.resolve();
        case 'abort': {
          const message = `As served set already exists: ${setId}`;
          logger.error(message);
          return Promise.reject(new Error(message));
        }
        case 'overwrite': {
          logger.debug(`Updating existing as served set: ${setId}`);
          await this.apiClient.portionSize.asServed.update(setId, pkgSet.description, pkgSet.label);
        }
      }
    }

    await this.updateAsServedSetImages(setId, pkgSet.images);
  }

  private async updateDrinkwareScales(
    setId: string,
    scales: Record<number, PkgDrinkScale>,
  ): Promise<void> {
    logger.debug(`Updating sliding scales for drinkware set ${setId}`);

    logger.debug('Deleting existing sliding scales');
    await this.apiClient.portionSize.drinkware.deleteAllScales(setId);

    const entries = Object.entries(scales);

    logger.debug(`Uploading ${entries.length} new sliding scales`);

    const ops = entries.map(([choiceId, scale]) => {
      switch (scale.version) {
        case 1:
          return this.apiClient.portionSize.drinkware.createScaleV1(
            setId,
            choiceId,
            scale.width,
            scale.height,
            scale.emptyLevel,
            scale.fullLevel,
            path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, scale.baseImagePath),
            path.join(
              this.packageDirPath!,
              PkgConstants.IMAGE_DIRECTORY_NAME,
              scale.overlayImagePath,
            ),
            scale.label,
            scale.volumeSamples,
          );
        case 2:
          return this.apiClient.portionSize.drinkware.createScaleV2(
            setId,
            choiceId,
            path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, scale.baseImagePath),
            scale.label,
            scale.outlineCoordinates,
            scale.volumeSamples,
            scale.volumeMethod,
          );
        default:
          throw new Error(`Unknown drink scale version`);
      }
    });

    await Promise.all(ops);
  }

  private toScaleUpdateInput(scales: Record<number, PkgDrinkScale>): Dictionary<DrinkwareScaleUpdate> {
    const result: Dictionary<DrinkwareScaleUpdate> = {};

    for (const [scaleId, scale] of Object.entries(scales)) {
      if (scale.version !== 2)
        throw new Error('Only sliding scale version 2 is supported by this tool');

      result[scaleId] = {
        label: scale.label,
        baseImagePath: path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, scale.baseImagePath),
        outlineCoordinates: scale.outlineCoordinates,
        volumeSamples: scale.volumeSamples,
        volumeMethod: scale.volumeMethod,
      };
    }

    return result;
  }

  private async importDrinkwareSet(setId: string, pkgSet: PkgDrinkwareSet): Promise<void> {
    logger.info(`Importing drinkware set "${setId}"`);

    const createResult = await this.apiClient.portionSize.drinkware.create({
      id: setId,
      imageMapId: pkgSet.selectionImageMapId,
      description: pkgSet.description,
      label: pkgSet.label,
    });

    if (createResult.type === 'conflict') {
      switch (this.options.onConflict) {
        case 'skip':
          logger.debug(`Drinkware set already exists, skipping: ${setId}`);
          return Promise.resolve();
        case 'abort': {
          const message = `Drinkware set already exists: ${setId}`;
          logger.error(message);
          return Promise.reject(new Error(message));
        }
        case 'overwrite': {
          logger.debug(`Updating existing drinkware set: ${setId}`);
          break;
        }
      }
    }

    await this.apiClient.portionSize.drinkware.update(setId, {
      id: setId,
      imageMapId: pkgSet.selectionImageMapId,
      description: pkgSet.description,
      label: pkgSet.label,
    }, this.toScaleUpdateInput(pkgSet.scales));
  }

  private async importAsServedSets(): Promise<void> {
    if (this.asServedSets !== undefined) {
      await this.batchImport(this.asServedSets.filter(obj => !this.options.asServedIds || this.options.asServedIds.includes(obj.id)), 'as served image set', 10, obj =>
        this.importAsServedSet(obj));
    }
  }

  private async verifyAsServedImages(): Promise<void> {
    if (this.asServedSets !== undefined) {
      for (const set of this.asServedSets) {
        let setNamePrinted = false;
        for (const image of set.images) {
          const imagePath = path.join(this.packageDirPath!, PkgConstants.IMAGE_DIRECTORY_NAME, image.imagePath);
          try {
            await fs.access(imagePath, constants.F_OK);
          }
          catch {
            if (!setNamePrinted) {
              logger.error(`Set ${set.id} (${set.description}):`);
              setNamePrinted = true;
            }

            logger.error(`  "${image.imagePath}" missing or not readable`);
          }
        }
      }
    }
  }

  private async importDrinkwareSets(): Promise<void> {
    if (this.drinkwareSets !== undefined) {
      await this.batchImportRecord(this.drinkwareSets, 'drinkware set', 10, (id, obj) =>
        this.importDrinkwareSet(id, obj));
    }
  }

  private async importLocale(locale: PkgLocale): Promise<void> {
    const localeEntry = typeConverters.fromPackageLocale(locale);
    const localeId = locale.id;

    const result = await this.apiClient.locales.create(localeId, localeEntry);

    if (result.type === 'conflict') {
      switch (this.options.onConflict) {
        case 'skip':
          logger.info(`Skipping locale "${localeId}" due to a conflict`);
          return;
        case 'abort': {
          const message = `Failed to import locale "${localeId}" due to a conflict`;
          logger.error(message);
          logger.error(JSON.stringify(result.details, null, 2));
          throw new Error(message);
        }
        case 'overwrite': {
          const existing = await this.apiClient.locales.findByCode(localeId);

          if (existing === null)
            throw new Error(`Failed to fetch existing locale data: ${localeId}`);

          await this.apiClient.locales.update(existing.id, localeEntry);
        }
      }
    }
  }

  private async importLocales(): Promise<void> {
    if (this.locales !== undefined) {
      await this.batchImport(this.locales, 'locale record', 50, locale =>
        this.importLocale(locale));
    }
  }

  private async importCategory(localeId: string, category: PkgCategory): Promise<void> {
    const request = typeConverters.fromPackageCategory(category);

    const result = await this.apiClient.categories.createCategory(localeId, request);

    if (result.type === 'conflict') {
      switch (this.options.onConflict) {
        case 'skip':
          logger.info(`Skipping category "${category.code}" due to a conflict`);
          return;
        case 'abort': {
          const message = `Failed to import local category "${category.code}" due to a conflict`;
          logger.error(message);
          logger.error(JSON.stringify(result.details, null, 2));
          throw new Error(message);
        }
        case 'overwrite': {
          const existing = result.details;

          if (existing !== null) {
            await this.apiClient.categories.updateCategory(
              localeId,
              category.code,
              existing.version,
              omit(request, 'code'),
            );
          }
        }
      }
    }
  }

  private async importCategories(): Promise<void> {
    if (this.localCategories !== undefined) {
      for (const [localeId, categories] of Object.entries(this.localCategories)) {
        logger.info(`Importing local category record(s) for locale ${localeId}...`);
        await this.batchImport(categories, 'local category record', 50, category =>
          this.importCategory(localeId, category));
      }
    }
  }

  private async importFood(localeId: string, food: PkgFood): Promise<void> {
    const createRequest = typeConverters.fromPackageFood(food);

    if (this.options.onConflict === 'skip' || this.options.onConflict === 'abort') {
      const result = await this.apiClient.foods.createFood(localeId, createRequest, {
        update: false,
        return: false,
      });

      if (result.type === 'conflict') {
        if (this.options.onConflict === 'skip') {
          logger.info(`Skipping local food "${food.code}" due to a conflict`);
        }
        else {
          const message = `Failed to import local food "${food.code}" due to a conflict`;
          logger.error(message);
          logger.error(JSON.stringify(result.details, null, 2));
          throw new Error(message);
        }
      }
    }
    else {
      const result = await this.apiClient.foods.createFood(localeId, createRequest, {
        update: true,
        return: false,
      });

      if (result.type === 'conflict') {
        const message = `Failed to import local food "${food.code}" due to a conflict`;
        logger.error(message);
        logger.error(JSON.stringify(result.details, null, 2));
        throw new Error(message);
      }
    }

    if (food.thumbnailPath !== undefined) {
      await this.apiClient.foods.updateThumbnail(localeId, food.code, path.join(this.packageDirPath!, food.thumbnailPath));
    }
  }

  private async importFoods(): Promise<void> {
    if (this.localFoods !== undefined) {
      for (const [localeId, localFoods] of Object.entries(this.localFoods)) {
        logger.info(`Importing local food record(s) for locale ${localeId}...`);
        await this.batchImport(localFoods.filter(food => !this.options.foodIds || this.options.foodIds.includes(food.code)), 'local food record', 50, food =>
          this.importFood(localeId, food));
      }
    }
  }

  private async verifyPortionSizeImagesForFood(localeId: string, food: PkgFood): Promise<void> {
    for (const psm of food.portionSize) {
      switch (psm.method) {
        case 'as-served': {
          if (await this.apiClient.portionSize.asServed.get(psm.servingImageSet) == null) {
            logger.error(`Food ${food.code} in locale ${localeId} refers to as served image set ${psm.servingImageSet} that does not exist`);
          }
          if (psm.leftoversImageSet && await this.apiClient.portionSize.asServed.get(psm.leftoversImageSet) == null) {
            logger.error(`Food ${food.code} in locale ${localeId} refers to as served image set ${psm.leftoversImageSet} that does not exist`);
          }
          break;
        }
        case 'drink-scale': {
          if (await this.apiClient.portionSize.drinkware.get(psm.drinkwareId) == null) {
            logger.error(`Food ${food.code} in locale ${localeId} refers to drinkware set ${psm.drinkwareId} that does not exist`);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  private async verifyPortionSizeImages(): Promise<void> {
    if (this.localFoods !== undefined) {
      for (const [localeId, foods] of Object.entries(this.localFoods)) {
        logger.info(`Verifying portion size image references for ${localeId}...`);
        await this.batchOperation(foods, 50, food => this.verifyPortionSizeImagesForFood(localeId, food));
      }
    }
  }

  private async importNutrientTables(): Promise<void> {
    if (this.nutrientTables !== undefined) {
      for (const nutrientTable of this.nutrientTables) {
        logger.info(`Importing nutrient table ${nutrientTable.id}`);

        const record = typeConverters.fromPackageNutrientTable(nutrientTable);
        const existing = await this.apiClient.nutrientTables.get(nutrientTable.id);

        if (existing === null) {
          await this.apiClient.nutrientTables.create(record);
        }
        else {
          switch (this.options.onConflict) {
            case 'skip':
              logger.info(`Skipping nutrient table "${nutrientTable.id}" due to a conflict`);
              continue;
            case 'abort':
              throw new Error(
                `Failed to import nutrient table ${nutrientTable.id} due to a conflict`,
              );
            case 'overwrite':
              await this.apiClient.nutrientTables.update(nutrientTable.id, record);
          }
        }

        const nutrientRecords = typeConverters.fromPackageNutrientTableRecords(nutrientTable);
        logger.info(
          `Updating ${nutrientRecords.length} nutrient record(s) in table ${nutrientTable.id}`,
        );
        await this.apiClient.nutrientTables.updateRecords(nutrientTable.id, nutrientRecords);
      }
    }
  }

  private async importAsServedLabel(setId: string, label: Record<string, string>): Promise<void> {
    const set = await this.apiClient.portionSize.asServed.get(setId);
    if (set === null)
      throw new Error(`Failed to update as served set ${setId} because it doesn't exist`);
    await this.apiClient.portionSize.asServed.update(setId, set.description, label);
  }

  private async importGuideImageLabel(id: string, label: Record<string, string>): Promise<void> {
    const guideImage = await this.apiClient.portionSize.guideImages.get(id);
    if (guideImage === null)
      throw new Error(`Failed to update guide image ${id} because it doesn't exist`);

    await this.apiClient.portionSize.guideImages.update(id, guideImage.description, [], label);
  }

  private async importPortionSizeImageLabels(): Promise<void> {
    if (this.portionSizeImageLabels !== undefined) {
      await this.batchImportRecord(this.portionSizeImageLabels.asServed, 'as served label', 50, (id, obj) => this.importAsServedLabel(id, obj));
      await this.batchImportRecord(this.portionSizeImageLabels.guide, 'guide image label', 50, (id, obj) => this.importGuideImageLabel(id, obj));
      // await this.batchImportRecord(this.portionSizeImageLabels.drinkware, 'drinkware set label', 50, (id, obj) => this.importDrinkwareSetLabel(id, obj));
    }
  }

  private async readJSON<T>(relativePath: string): Promise<T | undefined> {
    const filePath = path.join(this.packageDirPath!, relativePath);
    logger.debug(`Reading JSON file: ${filePath}`);

    try {
      await fs.access(filePath);
    }
    catch {
      logger.debug(`File ${filePath} does not exist or is not accessible, skipping`);
      return undefined;
    }

    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  }

  private async readLocales(): Promise<void> {
    logger.info('Loading locales');
    this.locales = await this.readJSON(PkgConstants.LOCALES_FILE_NAME);
  }

  private async readFoods(): Promise<void> {
    logger.info('Loading foods');
    this.localFoods = await this.readJSON(PkgConstants.FOODS_FILE_NAME);
  }

  private async readCategories(): Promise<void> {
    logger.info('Loading global categories');
    this.localCategories = await this.readJSON(PkgConstants.CATEGORIES_FILE_NAME);
  }

  private async readNutrientTables(): Promise<void> {
    logger.info('Loading nutrient tables');
    this.nutrientTables = await this.readJSON(PkgConstants.NUTRIENT_TABLES_FILE_NAME);
  }

  private async readImageMaps(): Promise<void> {
    logger.info('Loading image maps');
    this.imageMaps = await this.readJSON(
      path.join(PkgConstants.PORTION_SIZE_DIRECTORY_NAME, PkgConstants.IMAGE_MAP_FILE_NAME),
    );
  }

  private async readAsServedSets(): Promise<void> {
    logger.info('Loading as served sets');
    this.asServedSets = await this.readJSON(
      path.join(PkgConstants.PORTION_SIZE_DIRECTORY_NAME, PkgConstants.AS_SERVED_FILE_NAME),
    );
  }

  private async readDrinkwareSets(): Promise<void> {
    logger.info('Loading drinkware sets');
    this.drinkwareSets = await this.readJSON(
      path.join(PkgConstants.PORTION_SIZE_DIRECTORY_NAME, PkgConstants.DRINKWARE_FILE_NAME),
    );
  }

  private async readGuideImages(): Promise<void> {
    logger.info('Loading guide images');
    this.guideImages = await this.readJSON(
      path.join(PkgConstants.PORTION_SIZE_DIRECTORY_NAME, PkgConstants.GUIDE_IMAGE_FILE_NAME),
    );
  }

  private async readPortionSizeImageLabels(): Promise<void> {
    logger.info('Loading portion size image labels');
    this.portionSizeImageLabels = await this.readJSON(
      path.join(PkgConstants.PORTION_SIZE_DIRECTORY_NAME, PkgConstants.PORTION_SIZE_IMAGE_LABELS_FILE_NAME),
    );
  }

  public async readPackage(): Promise<void> {
    await Promise.all([
      this.readLocales(),
      this.readFoods(),
      this.readNutrientTables(),
      this.readImageMaps(),
      this.readGuideImages(),
      this.readAsServedSets(),
      this.readDrinkwareSets(),
    ]);
  }

  public async cleanUpPackage(): Promise<void> {
    if (this.compressedPackage) {
      logger.info(`Cleaning up temporary files`);
      await fs.rm(this.packageDirPath!, { recursive: true });
    }
  }

  public async unzipPackage(): Promise<void> {
    const stat = await fs.stat(this.inputFilePath);

    if (stat.isDirectory()) {
      this.packageDirPath = this.inputFilePath;
    }
    else {
      this.packageDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'i24pkg-'));
      this.compressedPackage = true;
      logger.info(`Extracting package: ${this.inputFilePath}`);
      logger.debug(`Temporary package directory: ${this.packageDirPath}`);
      await decompress(this.inputFilePath, this.packageDirPath);
    }

    this.imageDirPath = path.join(this.packageDirPath, PkgConstants.IMAGE_DIRECTORY_NAME);
  }

  /**
   * Execute the specific modules in order
   */
  private async specificModuleExecution(moduleKeys: ImporterSpecificModulesExecutionStrategy[]) {
    // If the only option is "all", execute all modules in order
    if (moduleKeys.length === 1 && moduleKeys[0] === 'all') {
      moduleKeys = Object.keys(this.availableModules) as ImporterSpecificModulesExecutionStrategy[];
    }
    else {
      // Verify if all the supplied options are valid
      const invalidKeys = moduleKeys.filter(
        key => !(key in this.availableModules) || key === 'all',
      );

      if (invalidKeys.length > 0) {
        console.error(`Invalid steps combination: ${invalidKeys.join(', ')}`);
        return;
      }
    }

    // Execute the modules in order
    for (const key of moduleKeys) {
      const module = this.availableModules[key];
      if (module)
        await module();
      else
        console.error(`No module found for key: ${key}`);
    }
  }

  public async import(): Promise<void> {
    await this.unzipPackage();

    if (
      this.options.modulesForExecution === undefined
      || this.options.modulesForExecution.length === 0
    ) {
      this.options.modulesForExecution = ['all'];
    }

    try {
      await this.specificModuleExecution(this.options.modulesForExecution);
    }
    finally {
      await this.cleanUpPackage();
    }

    logger.info('Done!');

    // await this.importImageMaps();
  }
}
