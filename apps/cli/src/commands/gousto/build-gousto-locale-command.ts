import type csvParser from 'csv-parser';
import { randomUUID } from 'node:crypto';

import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import parseCsv from 'csv-parser';
import { groupBy, mapValues } from 'lodash';
import removeBOM from 'remove-bom-stream';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import { Dictionary } from '@intake24/common/types';
import { PackageWriter } from '../packager/package-writer';
import { PkgGlobalCategory, PkgLocalCategory } from '../packager/types/categories';
import { PkgGlobalFood, PkgLocalFood } from '../packager/types/foods';

export interface GoustoLocaleOptions {
  sourcePath: string;
  thumbnailDir: string;
  outputPath: string;
  localeId: string;
}

interface GoustoRecipeRow {
  menuWeekSelected: string;
  goustoRecipeId: string;
  recipeTitle: string;
  primaryProteinSource: string;
  ingredientCode: string;
  ingredientQuantityInMealFor1: string;
  ingredientQuantityInMealFor2: string;
  ingredientQuantityInMealFor3: string;
  ingredientQuantityInMealFor4: string;
  ingredientQuantityInMealFor5: string;
  description: string;
  netProductWeightGrams: string;
  netProductWeightGramsPerPortion: string;
  menuWeeksAvailable: string;
  lastMenuWeekAvailable: string;
  quantity: string;
  approved: string;
  precollString: string;
}

interface GoustoRecipeData {
  recipeTitle: string;
  primaryProteinSource: string;
}

const thumbnailsPackageDirName = path.join ('images', 'thumbnail');

async function readCSV(
  path: string,
  onRowData: (data: any) => void,
  optionsOrHeaders?: csvParser.Options | ReadonlyArray<string>,
): Promise<void> {
  return new Promise((resolve) => {
    createReadStream(path)
      .pipe(removeBOM())
      .pipe(parseCsv(optionsOrHeaders))
      .on('data', (data: any) => {
        onRowData(data);
      })
      .on('end', () => {
        resolve();
      });
  });
}

async function readRecipeDropCSV(path: string): Promise<GoustoRecipeRow[]> {
  const rows: GoustoRecipeRow[] = [];

  await readCSV(
    path,
    (data) => {
      if (data.goustoRecipeId)
        rows.push(data);
    },
    {
      headers: [
        'menuWeekSelected',
        'goustoRecipeId',
        'recipeTitle',
        'primaryProteinSource',
        'ingredientCode',
        'ingredientQuantityInMealFor1',
        'ingredientQuantityInMealFor2',
        'ingredientQuantityInMealFor3',
        'ingredientQuantityInMealFor4',
        'ingredientQuantityInMealFor5',
        'description',
        'netProductWeightGrams',
        'netProductWeightGramsPerPortion',
        'menuWeeksAvailable',
        'lastMenuWeekAvailable',
        'quantity',
        'approved',
        'precollString',
      ],
      skipLines: 1,
    },
  );

  return rows;
}

function buildRecipeData(rows: GoustoRecipeRow[]): Dictionary<GoustoRecipeData> {
  function buildSingleRecipeData(singleRecipeRows: GoustoRecipeRow[]): GoustoRecipeData {
    return {
      recipeTitle: singleRecipeRows[0].recipeTitle,
      primaryProteinSource: singleRecipeRows[0].primaryProteinSource,
    };
  }

  return mapValues(
    groupBy(rows, row => row.goustoRecipeId),
    rows => buildSingleRecipeData(rows),
  );
}

function codeTransform(recipeId: string): string {
  return `G${recipeId.replaceAll('-', '')}`;
}

function buildLocalFoods(recipeData: Dictionary<GoustoRecipeData>, thumbnailFileNames: string[], usedFileNames: Set<string>): PkgLocalFood[] {
  function buildLocalFood(recipeId: string, recipeData: GoustoRecipeData): PkgLocalFood {
    return {
      code: codeTransform(recipeId),
      associatedFoods: [],
      brandNames: [],
      nutrientTableCodes: {
        FR_TEMP: 'FRPH1',
      },
      portionSize: [{
        method: 'standard-portion',
        conversionFactor: 1,
        description: 'use_a_standard_portion',
        units: [{
          name: 'gousto_standard_portion',
          weight: 1,
          omitFoodDescription: false,
        }],
        useForRecipes: false,
      }],
      alternativeNames: {},
      localDescription: `Gousto ${recipeData.recipeTitle}`,
      tags: ['gousto-recipe'],
      thumbnailPath: getThumbnailImagePath(thumbnailFileNames, recipeId, usedFileNames),
    };
  }

  return Object.entries(recipeData).map(([recipeId, recipeData]) => buildLocalFood(recipeId, recipeData));
}

function buildGlobalFoods(recipeData: Dictionary<GoustoRecipeData>): PkgGlobalFood[] {
  function buildGlobalFood(recipeId: string, recipeData: GoustoRecipeData): PkgGlobalFood {
    return {
      code: codeTransform(recipeId),
      attributes: {},
      englishDescription: recipeData.recipeTitle,
      parentCategories: [makeCategoryCode(recipeData.primaryProteinSource)],
      version: randomUUID(),
    };
  }

  return Object.entries(recipeData).map(([recipeId, recipeData]) => buildGlobalFood(recipeId, recipeData));
}

function makeCategoryCode(proteinSource: string): string {
  const source = proteinSource === 'None' ? 'Other' : proteinSource;
  return `G_${source.replace(/\W+/, '').toLocaleUpperCase().substring(0, 6)}`;
}

function getProteinSources(recipeData: Dictionary<GoustoRecipeData>): string[] {
  const proteinSources = new Set<string>();
  Object.values(recipeData).forEach(recipe => proteinSources.add(recipe.primaryProteinSource === 'None' ? 'Other' : recipe.primaryProteinSource));
  const array = [...proteinSources];
  array.sort();
  return array;
}

function buildGlobalCategories(proteinSources: string[]): PkgGlobalCategory[] {
  const proteinCategories = proteinSources.map(s => ({
    code: makeCategoryCode(s),
    attributes: {},
    englishDescription: s,
    isHidden: false,
    parentCategories: ['GOUSTO'],
    version: randomUUID(),
  }));

  return [{
    code: 'GOUSTO',
    attributes: {},
    englishDescription: 'Gousto recipes',
    isHidden: false,
    parentCategories: [],
    version: randomUUID(),
  }, ...proteinCategories];
}

function buildLocalCategories(proteinSources: string[]): PkgLocalCategory[] {
  const proteinCategories = proteinSources.map(s => ({
    localDescription: s,
    portionSize: [],
    code: makeCategoryCode(s),
  }));

  return [{
    code: 'GOUSTO',
    portionSize: [],
    localDescription: 'Gousto recipes',
  }, ...proteinCategories];
}

async function getThumbnailFileNames(thumbnailDir: string): Promise<string[]> {
  const files = await fs.readdir(thumbnailDir);
  const filteredFiles = files.filter(file => file !== '.' && file !== '..');
  return filteredFiles;
}

function getThumbnailImagePath(fileNames: string[], recipeId: string, usedFileNames: Set<string>): string | undefined {
  const altPrefix = recipeId.replace(/^R-/, ''); // Remove 'R-' prefix
  const alt2Prefix = altPrefix.replace(/-\d+$/, ''); // Remove '-X' suffix where X is a number

  // Try full recipe ID first (e.g. R-1234-2), then numerical prefix (1234-2), then shortened ID (1234).
  // Some files seem to not have the -X suffix but still match the recipe name.

  const fileName = fileNames.find(file => file.startsWith(recipeId))
    ?? fileNames.find(file => file.startsWith(altPrefix))
    ?? fileNames.find(file => file.startsWith(alt2Prefix));

  if (fileName === undefined) {
    console.warn(`Thumbnail image not found for recipe id ${recipeId}`);
    return undefined;
  }

  usedFileNames.add(fileName);

  return path.join(thumbnailsPackageDirName, fileName);
}

export default async (options: GoustoLocaleOptions): Promise<void> => {
  const logger = mainLogger.child({ service: 'Gousto locale build' });

  logger.info('Reading recipe file');

  const recipeRows = await readRecipeDropCSV(options.sourcePath);

  const thumbnailFileNames = await getThumbnailFileNames(options.thumbnailDir);

  const recipeData = buildRecipeData(recipeRows);

  const proteinSources = getProteinSources(recipeData);

  const globalCategories = buildGlobalCategories(proteinSources);

  const localCategories = buildLocalCategories(proteinSources);

  const globalFoods = buildGlobalFoods(recipeData);

  const usedThumbnailNames = new Set<string>();

  const localFoods = buildLocalFoods(recipeData, thumbnailFileNames, usedThumbnailNames);

  const writer = new PackageWriter(logger, options.outputPath);

  await Promise.all([
    writer.writeGlobalCategories(globalCategories),
    writer.writeLocalCategories({
      [options.localeId]: localCategories,
    }),
    writer.writeLocalFoods(
      {
        [options.localeId]: localFoods,
      },
    ),
    writer.writeGlobalFoods(
      globalFoods,
    ),
    writer.writeEnabledLocalFoods(
      {
        [options.localeId]: globalFoods.map(f => f.code),
      },
    ),
    writer.writePackageInfo(),
  ]);

  const packageThumbnailsPath = path.join(options.outputPath, thumbnailsPackageDirName);

  fs.mkdir(packageThumbnailsPath, { recursive: true });

  await Promise.all(
    [...usedThumbnailNames]
      .map(fileName => fs.copyFile(path.join(options.thumbnailDir, fileName), path.join(packageThumbnailsPath, fileName))),
  );
};
