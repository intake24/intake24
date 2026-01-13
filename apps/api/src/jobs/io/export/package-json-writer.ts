import type { PackageWriter, PackageWriterFactory } from './types';
import type { PackageExportOptions } from '@intake24/common/types/http/admin';
import type { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
import type { PkgV2Food } from '@intake24/common/types/package/foods';
import type { PkgV2GuideImage } from '@intake24/common/types/package/guide-image';
import type { PkgV2ImageMap } from '@intake24/common/types/package/image-map';
import type { PkgV2Locale } from '@intake24/common/types/package/locale';

import fs from 'node:fs/promises';
import path from 'node:path';

const PORTION_SIZE_DIRECTORY_NAME = 'portion-size';
const FOODS_FILE_NAME = 'foods.json';
const CATEGORIES_FILE_NAME = 'categories.json';
const AS_SERVED_FILE_NAME = 'as-served.json';
const IMAGE_MAPS_FILE_NAME = 'image-maps.json';
const GUIDE_IMAGES_FILE_NAME = 'guide-images.json';
const DRINKWARE_SETS_FILE_NAME = 'drinkware-sets.json';

export class PackageJsonWriter implements PackageWriter {
  private outputPath: string;
  private foodsByLocale: Map<string, PkgV2Food[]> = new Map();
  private categoriesByLocale: Map<string, PkgV2Category[]> = new Map();
  private asServedSets: PkgV2AsServedSet[] = [];
  private imageMaps: PkgV2ImageMap[] = [];
  private guideImages: PkgV2GuideImage[] = [];
  private drinkwareSets: PkgV2DrinkwareSet[] = [];
  private locales: PkgV2Locale[] = [];

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  public async writeFood(localeId: string, food: PkgV2Food): Promise<void> {
    let foods = this.foodsByLocale.get(localeId);
    if (foods === undefined) {
      foods = [];
      this.foodsByLocale.set(localeId, foods);
    }
    foods.push(food);
  }

  public async writeCategory(localeId: string, category: PkgV2Category): Promise<void> {
    let categories = this.categoriesByLocale.get(localeId);
    if (categories === undefined) {
      categories = [];
      this.categoriesByLocale.set(localeId, categories);
    }
    categories.push(category);
  }

  public async writeLocale(locale: PkgV2Locale): Promise<void> {
    this.locales.push(locale);
  }

  public async writeAsServedSet(asServedSet: PkgV2AsServedSet): Promise<void> {
    this.asServedSets.push(asServedSet);
  }

  public async writeImageMap(imageMap: PkgV2ImageMap): Promise<void> {
    this.imageMaps.push(imageMap);
  }

  public async writeGuideImage(guideImage: PkgV2GuideImage): Promise<void> {
    this.guideImages.push(guideImage);
  }

  public async writeDrinkwareSet(drinkwareSet: PkgV2DrinkwareSet): Promise<void> {
    this.drinkwareSets.push(drinkwareSet);
  }

  public async finish(): Promise<void> {
    if (this.locales.length > 0) {
      const filePath = path.join(this.outputPath, 'locales.json');
      await fs.writeFile(filePath, JSON.stringify(this.locales, null, 2), 'utf-8');
    }

    if (this.foodsByLocale.size > 0) {
      const foods: Record<string, PkgV2Food[]> = Object.fromEntries(this.foodsByLocale);
      const filePath = path.join(this.outputPath, FOODS_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(foods, null, 2), 'utf-8');
    }

    if (this.categoriesByLocale.size > 0) {
      const categories: Record<string, PkgV2Category[]> = Object.fromEntries(this.categoriesByLocale);
      const filePath = path.join(this.outputPath, CATEGORIES_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(categories, null, 2), 'utf-8');
    }

    const portionSizeDir = path.join(this.outputPath, PORTION_SIZE_DIRECTORY_NAME);
    const hasPortionSizeData = this.asServedSets.length > 0 || this.imageMaps.length > 0 || this.guideImages.length > 0 || this.drinkwareSets.length > 0;

    if (hasPortionSizeData) {
      await fs.mkdir(portionSizeDir, { recursive: true });
    }

    if (this.asServedSets.length > 0) {
      const filePath = path.join(portionSizeDir, AS_SERVED_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(this.asServedSets, null, 2), 'utf-8');
    }

    if (this.imageMaps.length > 0) {
      const filePath = path.join(portionSizeDir, IMAGE_MAPS_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(this.imageMaps, null, 2), 'utf-8');
    }

    if (this.guideImages.length > 0) {
      const filePath = path.join(portionSizeDir, GUIDE_IMAGES_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(this.guideImages, null, 2), 'utf-8');
    }

    if (this.drinkwareSets.length > 0) {
      const filePath = path.join(portionSizeDir, DRINKWARE_SETS_FILE_NAME);
      await fs.writeFile(filePath, JSON.stringify(this.drinkwareSets, null, 2), 'utf-8');
    }
  }
}

export function createPackageJsonWriter(): PackageWriterFactory {
  return async (outputPath: string, _exportOptions: PackageExportOptions): Promise<PackageWriter> => {
    return new PackageJsonWriter(outputPath);
  };
}
