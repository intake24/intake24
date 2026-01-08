import fs from 'node:fs/promises';
import path from 'node:path';

import { keys, sortBy, zip } from 'lodash-es';

import type { ApiClientV3 } from '@intake24/api-client-v3';
import { PkgConstants } from '@intake24/cli/commands/packager/constants';
import { PackageWriter } from '@intake24/cli/commands/packager/package-writer';
import type { PkgAsServedSet } from '@intake24/cli/commands/packager/types/as-served';
import type { PkgCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type { PkgDrinkwareSet } from '@intake24/cli/commands/packager/types/drinkware';
import type { PkgFood, PkgPortionSizeMethod } from '@intake24/cli/commands/packager/types/foods';
import type { PkgGuideImage } from '@intake24/cli/commands/packager/types/guide-image';
import type { PkgImageMap } from '@intake24/cli/commands/packager/types/image-map';
import type { PkgLocale } from '@intake24/cli/commands/packager/types/locale';
import typeConverters from '@intake24/cli/commands/packager/types/v3-type-conversions';
import logger from '@intake24/common-backend/services/logger/logger';

export type Logger = typeof logger;

export interface ExporterOptions {
  jsonSpaces: number;
  outputEncoding: BufferEncoding;
  maxConcurrentApiRequests: number;
}

const defaultOptions: ExporterOptions = {
  jsonSpaces: 2,
  outputEncoding: 'utf-8',
  maxConcurrentApiRequests: 1,
};

interface LocaleData {
  properties: PkgLocale;
  enabledLocalFoods: string[];
  foods: PkgFood[];
  categories: PkgCategory[];
}

export class ExporterV3 {
  private readonly workingDir: string;
  private readonly apiClient: ApiClientV3;
  private readonly logger: Logger;
  private readonly options: ExporterOptions;

  private readonly imageDirPath: string;

  private localeIds = new Set<string>();
  private foodCompositionTableIds = new Set<string>();
  private asServedSetIds = new Set<string>();
  private guideImageIds = new Set<string>();
  private imageMapIds = new Set<string>();
  private drinkwareIds = new Set<string>();
  private images: Set<string> = new Set<string>();

  private skipFoodCodes: Set<string> = new Set<string>();

  constructor(
    apiClient: ApiClientV3,
    logger: Logger,
    workingDir: string,
    options?: Partial<ExporterOptions>,
  ) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.workingDir = workingDir;
    this.imageDirPath = path.join(this.workingDir, PkgConstants.IMAGE_DIRECTORY_NAME);
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  private async getAsServedData(asServedSetId: string): Promise<PkgAsServedSet> {
    logger.info(`Fetching data for as served set '${asServedSetId}'`);

    const set = await this.apiClient.portionSize.exportAsServedSet(asServedSetId);

    if (set === null)
      throw new Error(`Invalid as served set id: ${asServedSetId} (Not Found)`);

    return typeConverters.packageAsServedSet(set);
  }

  async addAsServedSets(setIds: string[]): Promise<void> {
    setIds.forEach(this.asServedSetIds.add);
  }

  private async getGuideImageData(guideImageId: string): Promise<PkgGuideImage> {
    logger.info(`Fetching data for guide image '${guideImageId}'`);

    const guideImage = await this.apiClient.portionSize.getGuideImage(guideImageId);

    if (guideImage === null) {
      throw new Error(`Invalid guide image id: ${guideImageId} (Not Found)`);
    }
    else {
      return {
        imageMapId: guideImage.imageMapId,
        description: guideImage.description,
        objectWeights: Object.fromEntries(guideImage.objects.map(obj => [obj.id, obj.weight])),
      };
    }
  }

  private async getImageMapData(imageMapId: string): Promise<PkgImageMap> {
    logger.info(`Fetching data for image map '${imageMapId}'`);

    const imageMap = await this.apiClient.portionSize.exportImageMap(imageMapId);

    if (imageMap === null) {
      throw new Error(`Invalid image map id: ${imageMapId} (Not Found)`);
    }
    else {
      return {
        description: imageMap.description,
        baseImagePath: imageMap.baseImagePath,
        objects: Object.fromEntries(
          imageMap.objects.map(obj => [
            obj.id,
            {
              description: obj.description,
              outlineCoordinates: obj.outlineCoordinates,
              navigationIndex: obj.navigationIndex,
            },
          ]),
        ),
      };
    }
  }

  private async getDrinkwareData(drinkwareSetId: string): Promise<PkgDrinkwareSet> {
    logger.info(`Fetching data for drinkware set '${drinkwareSetId}'`);

    const drinkwareSet = await this.apiClient.portionSize.exportDrinkwareSet(drinkwareSetId);

    logger.debug(`Drinkware set id ${drinkwareSetId}`);
    logger.debug(`${JSON.stringify(drinkwareSet, null, 2)}`);

    if (drinkwareSet === null)
      throw new Error(`Invalid drinkware set id: ${drinkwareSetId} (Not Found)`);
    else
      return typeConverters.packageDrinkwareSet(drinkwareSet);
  }

  async getLocalFoodData(localeId: string, respondentLanguage: string, foodCode: string): Promise<PkgFood> {
    logger.info(`Fetching data for food (${localeId}, ${foodCode})`);

    const foodRecord = await this.apiClient.foods.getFoodRecord(localeId, foodCode);

    if (foodRecord === null)
      throw new Error(`Food record not found: (${localeId}, ${foodCode})`);

    return typeConverters.packageFood(foodRecord.main.code, respondentLanguage, foodRecord.main, foodRecord.local);
  }

  async getLocalCategoryData(localeId: string, categoryCode: string): Promise<PkgCategory> {
    logger.info(`Fetching data for category (${localeId}, ${categoryCode})`);

    const categoryRecord = await this.apiClient.categories.getCategoryRecord(
      localeId,
      categoryCode,
    );

    if (categoryRecord === null)
      throw new Error(`Category record not found: (${localeId}, ${categoryCode})`);

    return typeConverters.packageCategory(categoryRecord.main.code, categoryRecord.main, categoryRecord.local);
  }

  async getLocaleData(localeId: string): Promise<LocaleData> {
    logger.info(`Fetching data for locale '${localeId}'`);

    const properties = await this.apiClient.locales.get(localeId);

    if (properties === null)
      throw new Error(`Invalid locale id: ${localeId} (Not Found)`);

    const [localFoodRecordCodes, enabledLocalFoods, categoryCodes] = await Promise.all([
      this.apiClient.foods.getLocalFoodCodes(localeId),
      this.apiClient.foods.getEnabledLocalFoodCodes(localeId),
      this.apiClient.categories.getAllCategoryCodes(),
    ]);

    const sortedEnabledCodes = enabledLocalFoods.sort();

    const foods = await Promise.all(
      localFoodRecordCodes
        .filter(code => !this.skipFoodCodes.has(code))
        .map(foodCode => this.getLocalFoodData(localeId, properties.respondentLanguage, foodCode)),
    );

    const categories = await Promise.all(
      categoryCodes.map(categoryCode => this.getLocalCategoryData(localeId, categoryCode)),
    );

    const sortedFoods = sortBy(foods, food => food.code);
    const sortedCategories = sortBy(categories, category => category.code);

    return {
      properties: typeConverters.packageLocale(properties),
      foods: sortedFoods,
      enabledLocalFoods: sortedEnabledCodes,
      categories: sortedCategories,
    };
  }

  public skipFoods(foodCodes: string[]) {
    logger.debug(JSON.stringify(foodCodes));

    foodCodes.forEach(code => this.skipFoodCodes.add(code));
  }

  async addLocales(localeIds: string[]): Promise<void> {
    localeIds.forEach(id => this.localeIds.add(id));
  }

  private async writeJSON(object: any, outputPath: string): Promise<void> {
    const dirName = path.dirname(outputPath);
    await fs.mkdir(dirName, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(object, null, this.options.jsonSpaces), {
      encoding: this.options.outputEncoding,
    });
  }

  private async downloadImage(imagePath: string): Promise<string> {
    this.logger.info(`Downloading image: ${imagePath}`);

    const destPath = path.join(this.imageDirPath, imagePath);
    const destDir = path.dirname(destPath);

    await fs.mkdir(destDir, { recursive: true });
    await this.apiClient.images.downloadImage(imagePath, destPath);

    return destPath;
  }

  private async downloadImages(): Promise<void> {
    this.logger.info(`Downloading ${this.images.size} portion size images`);
    await Promise.all([...this.images].map(imagePath => this.downloadImage(imagePath)));
  }

  private collectFoodCompositionTableDependencies(localFoods: PkgFood[]): void {
    for (const localFood of localFoods)
      keys(localFood.nutrientTableCodes).forEach(id => this.foodCompositionTableIds.add(id));
  }

  private addPortionSizeDependencies(portionSize: PkgPortionSizeMethod) {
    switch (portionSize.method) {
      case 'as-served':
        this.asServedSetIds.add(portionSize.servingImageSet);
        if (portionSize.leftoversImageSet !== undefined)
          this.asServedSetIds.add(portionSize.leftoversImageSet);
        break;
      case 'guide-image':
        this.guideImageIds.add(portionSize.guideImageId);
        break;
      case 'drink-scale':
        this.drinkwareIds.add(portionSize.drinkwareId);
        break;
      case 'standard-portion':
        break;
      case 'cereal':
        this.imageMapIds.add(PkgConstants.CEREAL_BOWL_IMAGE_MAP);

        PkgConstants.CEREAL_BOWL_TYPES.flatMap(bowlType => [
          `${PkgConstants.CEREAL_AS_SERVED_PREFIX}${portionSize.type}${bowlType}`,
          `${PkgConstants.CEREAL_AS_SERVED_PREFIX}${portionSize.type}${bowlType}${PkgConstants.CEREAL_AS_SERVED_LEFTOVERS_SUFFIX}`,
        ]).forEach(id => this.asServedSetIds.add(id));

        break;
      case 'milk-on-cereal':
        PkgConstants.CEREAL_BOWL_TYPES.map(
          bowlType => `${PkgConstants.CEREAL_MILK_LEVEL_IMAGE_MAP_PREFIX}${bowlType}`,
        ).flatMap(id => this.imageMapIds.add(id));
        break;
      case 'pizza':
        this.imageMapIds.add(PkgConstants.PIZZA_IMAGE_MAP);
        this.imageMapIds.add(PkgConstants.PIZZA_THICKNESS_IMAGE_MAP);
        for (let i = 0; i < PkgConstants.PIZZA_TYPES_COUNT; ++i)
          this.imageMapIds.add(`${PkgConstants.PIZZA_SLICE_IMAGE_MAP_PREFIX}${i + 1}`);
        break;
      case 'milk-in-a-hot-drink':
        break;
    }
  }

  private collectFoodPortionSizeDependencies(localFoods: PkgFood[]): void {
    for (const localFood of localFoods) {
      for (const portionSize of localFood.portionSize)
        this.addPortionSizeDependencies(portionSize);
    }
  }

  private collectCategoryPortionSizeDependencies(localCategories: PkgCategory[]): void {
    for (const localCategory of localCategories) {
      for (const portionSize of localCategory.portionSize)
        this.addPortionSizeDependencies(portionSize);
    }
  }

  private collectDrinkwareDependencies(drinkwareSets: PkgDrinkwareSet[]): void {
    for (const drinkwareSet of drinkwareSets) {
      this.imageMapIds.add(drinkwareSet.selectionImageMapId);
      for (const [_id, scale] of Object.entries(drinkwareSet.scales)) {
        this.images.add(scale.baseImagePath);
        if (scale.version === 1)
          this.images.add(scale.overlayImagePath);
      }
    }
  }

  private collectGuideImageDependencies(guideImages: PkgGuideImage[]): void {
    for (const guideImage of guideImages)
      this.imageMapIds.add(guideImage.imageMapId);
  }

  private collectImageMapDependencies(imageMaps: PkgImageMap[]): void {
    for (const imageMap of imageMaps)
      this.images.add(imageMap.baseImagePath);
  }

  private collectAsServedDependencies(asServedSets: PkgAsServedSet[]): void {
    for (const asServedSet of asServedSets) {
      for (const image of asServedSet.images)
        this.images.add(image.imagePath);
    }
  }

  private cleanUp() {
    this.localeIds = new Set<string>();
    this.foodCompositionTableIds = new Set<string>();
    this.asServedSetIds = new Set<string>();
    this.guideImageIds = new Set<string>();
    this.imageMapIds = new Set<string>();
    this.drinkwareIds = new Set<string>();
    this.images = new Set<string>();
  }

  public async export() {
    const sortedLocaleIds = [...this.localeIds].toSorted();

    const localeData = await Promise.all(sortedLocaleIds.map(id => this.getLocaleData(id)));

    localeData.forEach((data) => {
      this.collectFoodPortionSizeDependencies(data.foods);
      this.collectCategoryPortionSizeDependencies(data.categories);
    });

    // Drinkware sets and guide images contain references to image maps, download these first
    // and collect dependencies before downloading image map data

    const sortedDrinkwareIds = [...this.drinkwareIds].sort();
    const drinkwareData = await Promise.all(
      sortedDrinkwareIds.map(id => this.getDrinkwareData(id)),
    );
    this.collectDrinkwareDependencies(drinkwareData);

    const sortedGuideImageIds = [...this.guideImageIds].sort();
    const guideImageData = await Promise.all(
      sortedGuideImageIds.map(id => this.getGuideImageData(id)),
    );
    this.collectGuideImageDependencies(guideImageData);

    const sortedImageMapIds = [...this.imageMapIds].sort();
    const imageMapData = await Promise.all(sortedImageMapIds.map(id => this.getImageMapData(id)));
    this.collectImageMapDependencies(imageMapData);

    const sortedAsServedIds = [...this.asServedSetIds].sort();
    const asServedData = await Promise.all(sortedAsServedIds.map(id => this.getAsServedData(id)));
    this.collectAsServedDependencies(asServedData);

    const writer = new PackageWriter(logger, this.workingDir, this.options);

    await Promise.all([
      writer.writeLocales(localeData.map(data => data.properties)),
      writer.writeFoods(
        Object.fromEntries(
          zip(
            sortedLocaleIds,
            localeData.map(data => data.foods),
          ),
        ),
      ),
      writer.writeCategories(
        Object.fromEntries(
          zip(
            sortedLocaleIds,
            localeData.map(data => data.categories),
          ),
        ),
      ),
      writer.writeEnabledLocalFoods(
        Object.fromEntries(
          zip(
            sortedLocaleIds,
            localeData.map(data => data.enabledLocalFoods),
          ),
        ),
      ),
      writer.writeDrinkwareSets(Object.fromEntries(zip(sortedDrinkwareIds, drinkwareData))),
      writer.writeGuideImages(Object.fromEntries(zip(sortedGuideImageIds, guideImageData))),
      writer.writeImageMaps(Object.fromEntries(zip(sortedImageMapIds, imageMapData))),
      writer.writeAsServedSets(asServedData),
      writer.writePackageInfo(),
    ]);

    await this.downloadImages();

    this.cleanUp();
  }
}
