import type { XlsxPackageMeta } from './package-meta';
import type {
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';
import type { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
import type {
  PkgV2AssociatedFood,
  PkgV2Food,
  PkgV2InheritableAttributes,
  PkgV2PortionSizeMethod,
} from '@intake24/common/types/package/foods';
import type { PkgV2GuideImage } from '@intake24/common/types/package/guide-image';
import type { PkgV2ImageMap } from '@intake24/common/types/package/image-map';
import type { PkgV2Locale } from '@intake24/common/types/package/locale';
import type { PkgV2SynonymSet } from '@intake24/common/types/package/synonym-sets';

import fs from 'node:fs/promises';
import path from 'node:path';

import ExcelJS from 'exceljs';

import { unzipFile } from '@intake24/api/util/files';

import { getVerifiedOutputPath } from '../import/utils';
import { XLSX_COLUMN_NAMES, XLSX_SHEET_NAMES } from '../xlsx-format-constants';
import { validatePackageMeta } from './package-meta';
import { PackageValidationFileErrors } from './types';
import { getFileValidationErrorMessages, validateJsonFiles } from './validate-json-files';

type FoodOrCategory = PkgV2Food | PkgV2Category;
type PortionTarget = 'food' | 'category';
type PsmPathway = PkgV2PortionSizeMethod['pathways'][number];

type StandardPortionDraft = Extract<PkgV2PortionSizeMethod, { method: 'standard-portion' }>;
type MilkInHotDrinkDraft = Extract<PkgV2PortionSizeMethod, { method: 'milk-in-a-hot-drink' }>;
type ParentFoodPortionDraft = Extract<PkgV2PortionSizeMethod, { method: 'parent-food-portion' }>;

const DEFAULT_PATHWAYS: PsmPathway[] = ['search'];
const VALID_PATHWAYS = new Set<PsmPathway>(['addon', 'afp', 'recipe', 'search']);

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;

  if (value && typeof value === 'object') {
    if ('result' in value)
      return value.result;
    if ('text' in value)
      return value.text;
    if ('richText' in value)
      return value.richText.map(item => item.text).join('');
  }

  return value;
}

function cellAsString(cell: ExcelJS.Cell): string {
  const value = cellValue(cell);

  if (value === null || value === undefined)
    return '';

  return String(value).trim();
}

function cellAsOptionalString(cell: ExcelJS.Cell): string | undefined {
  const value = cellAsString(cell);
  return value === '' ? undefined : value;
}

function numberValue(cell: ExcelJS.Cell, defaultValue: number = 0): number {
  const value = cellValue(cell);

  if (typeof value === 'number')
    return value;

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed))
      return parsed;
  }

  return defaultValue;
}

function cellAsBool(cell: ExcelJS.Cell): boolean | undefined {
  const value = cellValue(cell);

  if (value === null || value === undefined || value === '')
    return undefined;

  if (typeof value === 'boolean')
    return value;

  if (typeof value === 'number')
    return value !== 0;

  const normalised = String(value).trim().toLowerCase();

  if (['true', 'yes', 'y', '1'].includes(normalised))
    return true;
  if (['false', 'no', 'n', '0'].includes(normalised))
    return false;

  return undefined;
}

function splitList(value: string | undefined): string[] {
  return value?.split(';').map(item => item.trim()).filter(Boolean) ?? [];
}

function splitPathways(value: string | undefined): PsmPathway[] {
  const pathways = splitList(value).filter((item): item is PsmPathway => VALID_PATHWAYS.has(item as PsmPathway));
  return pathways.length ? pathways : [...DEFAULT_PATHWAYS];
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value)
    return fallback;

  return JSON.parse(value) as T;
}

function isRowEmpty(row: ExcelJS.Row): boolean {
  return !row.values || (Array.isArray(row.values) && row.values.length <= 1);
}

function getHeaderIndices(sheet: ExcelJS.Worksheet, rowNumber = 1): Map<string, number> {
  const headers = new Map<string, number>();
  const row = sheet.getRow(rowNumber);

  row.eachCell((cell, colNumber) => {
    const header = cellAsString(cell);
    if (header)
      headers.set(header, colNumber);
  });

  return headers;
}

function getSheetRequired(workbook: ExcelJS.Workbook, sheetName: string, fileName: string): ExcelJS.Worksheet {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet)
    throw new Error(`Missing sheet "${sheetName}" in ${fileName}`);

  return sheet;
}

function getCellByHeader(row: ExcelJS.Row, headerIndices: Map<string, number>, header: string): ExcelJS.Cell {
  const column = headerIndices.get(header);

  if (!column)
    throw new Error(`Missing column "${header}" in sheet "${row.worksheet.name}"`);

  return row.getCell(column);
}

function getOptionalCellByHeader(row: ExcelJS.Row, headers: Map<string, number>, header: string): ExcelJS.Cell | undefined {
  const column = headers.get(header);
  return column ? row.getCell(column) : undefined;
}

function addPortionSizeMethod(item: FoodOrCategory, psm: PkgV2PortionSizeMethod): void {
  item.portionSize.push(psm);
}

function resolvePackagePath(sourcePath: string, relativePath: string): string {
  const pathParts = relativePath.split(/[\\/]+/);

  if (
    !relativePath
    || path.isAbsolute(relativePath)
    || path.win32.isAbsolute(relativePath)
    || pathParts.includes('..')
  ) {
    throw new Error(`Invalid package manifest path "${relativePath}"`);
  }

  return path.join(sourcePath, ...pathParts);
}

function makeBasePsm<T extends PkgV2PortionSizeMethod['method']>(
  method: T,
  order: number,
  conversionFactor: number = 1,
  pathways: PsmPathway[] = [...DEFAULT_PATHWAYS],
) {
  return {
    method,
    description: '',
    pathways,
    conversionFactor,
    orderBy: String(order),
  };
}

function decodeUseInRecipes(value: string | undefined): 0 | 1 | 2 | undefined {
  switch (value) {
    case 'any_context':
      return 0;
    case 'regular_food':
      return 1;
    case 'recipe_ingredient':
      return 2;
    default:
      return undefined;
  }
}

function readAttributes(att: PkgV2InheritableAttributes, row: ExcelJS.Row) {
  const readyMealOption = cellAsBool(row.getCell(2));
  const reasonableAmount = cellAsOptionalString(row.getCell(3));
  const sameAsBeforeOption = cellAsBool(row.getCell(4));
  const useInRecipes = decodeUseInRecipes(cellAsOptionalString(row.getCell(5)));

  if (readyMealOption !== undefined)
    att.readyMealOption = readyMealOption;
  if (reasonableAmount !== undefined)
    att.reasonableAmount = Number(reasonableAmount);
  if (sameAsBeforeOption !== undefined)
    att.sameAsBeforeOption = sameAsBeforeOption;
  if (useInRecipes !== undefined)
    att.useInRecipes = useInRecipes;
}

function portionOrder(item: FoodOrCategory): number {
  return item.portionSize.length + 1;
}

export class Intake24XlsxPackageHandler implements PackageHandler {
  private readonly context: PackageHandlerContext;
  private sourcePath?: string;
  private convertedPackagePath?: string;
  private packageMeta?: XlsxPackageMeta;

  constructor(context: PackageHandlerContext) {
    this.context = context;
  }

  async verify(uploadedPath: string): Promise<PackageVerificationResult> {
    const { fileId, uploadDir } = this.context;

    try {
      await this.validateArchive(uploadedPath);
      this.sourcePath = await this.extractArchive(uploadedPath, uploadDir, fileId);
    }
    catch (err) {
      throw new PackageValidationFileErrors({ _uploadedFile: getFileValidationErrorMessages(err) });
    }

    try {
      this.convertedPackagePath = await this.convertPackage(this.sourcePath, uploadDir, fileId);
    }
    catch (err) {
      if (err instanceof PackageValidationFileErrors)
        throw err;

      throw new PackageValidationFileErrors({ package: getFileValidationErrorMessages(err) });
    }
    finally {
      if (this.sourcePath) {
        await fs.rm(this.sourcePath, { recursive: true, force: true });
      }
    }

    const packageContents = await validateJsonFiles(this.convertedPackagePath);
    const targetLocales = new Set<string>();

    packageContents.locales?.forEach(locale => targetLocales.add(locale.id));

    if (packageContents.foods) {
      Object.keys(packageContents.foods).forEach(locale => targetLocales.add(locale));
    }

    if (packageContents.categories) {
      Object.keys(packageContents.categories).forEach(locale => targetLocales.add(locale));
    }

    if (packageContents.synonymSets) {
      Object.keys(packageContents.synonymSets).forEach(locale => targetLocales.add(locale));
    }

    return {
      extractedPath: this.convertedPackagePath,
      summary: {
        targetLocales: [...targetLocales],
        files: {
          locales: !!packageContents.locales,
          foods: !!packageContents.foods,
          categories: !!packageContents.categories,
          synonymSets: !!packageContents.synonymSets,
          asServedSets: !!packageContents.asServedSets,
          imageMaps: !!packageContents.imageMaps,
          guideImages: !!packageContents.guideImages,
          drinkwareSets: !!packageContents.drinkwareSets,
          nutrientTables: false,
        },
      },
    };
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.sourcePath ? fs.rm(this.sourcePath, { recursive: true, force: true }) : Promise.resolve(),
      this.convertedPackagePath ? fs.rm(this.convertedPackagePath, { recursive: true, force: true }) : Promise.resolve(),
    ]);
  }

  private async validateArchive(uploadedPath: string): Promise<void> {
    this.packageMeta = await validatePackageMeta(uploadedPath, 'xlsx') as XlsxPackageMeta;
  }

  private async extractArchive(uploadedPath: string, uploadDir: string, fileId: string): Promise<string> {
    const extractedPath = path.join(uploadDir, `i24-xlsx-source-${fileId}`);
    await unzipFile(uploadedPath, extractedPath);
    return extractedPath;
  }

  private async convertPackage(sourcePath: string, uploadDir: string, fileId: string): Promise<string> {
    const convertedPackagePath = getVerifiedOutputPath(uploadDir, fileId);
    const files = await fs.readdir(sourcePath);
    const packageMeta = this.packageMeta;
    const writes: Promise<void>[] = [];

    if (!packageMeta)
      throw new Error('Package metadata not loaded');

    await fs.mkdir(convertedPackagePath, { recursive: true });

    const writeJson = async (filename: string, data: unknown) => {
      await fs.writeFile(
        path.join(convertedPackagePath, filename),
        JSON.stringify(data, null, 2),
        'utf-8',
      );
    };

    writes.push(writeJson('package.json', {
      version: '2.0',
      format: 'json',
    }));

    if (files.includes('locales.xlsx'))
      writes.push(writeJson('locales.json', await this.readLocales(path.join(sourcePath, 'locales.xlsx'))));

    const foodWorkbooks = Object.entries(packageMeta.workbookPaths.foods);

    if (foodWorkbooks.length) {
      const foods: Record<string, PkgV2Food[]> = {};

      for (const [localeId, workbookPath] of foodWorkbooks)
        foods[localeId] = await this.readFoods(resolvePackagePath(sourcePath, workbookPath), workbookPath);

      writes.push(writeJson('foods.json', foods));
    }

    const categoryWorkbooks = Object.entries(packageMeta.workbookPaths.categories);

    if (categoryWorkbooks.length) {
      const categories: Record<string, PkgV2Category[]> = {};

      for (const [localeId, workbookPath] of categoryWorkbooks)
        categories[localeId] = await this.readCategories(resolvePackagePath(sourcePath, workbookPath), workbookPath);

      writes.push(writeJson('categories.json', categories));
    }

    if (files.includes('synonym-sets.xlsx'))
      writes.push(writeJson('synonym-sets.json', await this.readSynonymSets(path.join(sourcePath, 'synonym-sets.xlsx'))));

    if (files.includes('portion-size.xlsx')) {
      const portionData = await this.readPortionReferenceData(path.join(sourcePath, 'portion-size.xlsx'));

      if (portionData.asServedSets.length)
        writes.push(writeJson('as-served-sets.json', portionData.asServedSets));
      if (portionData.imageMaps.length)
        writes.push(writeJson('image-maps.json', portionData.imageMaps));
      if (portionData.guideImages.length)
        writes.push(writeJson('guide-images.json', portionData.guideImages));
      if (portionData.drinkwareSets.length)
        writes.push(writeJson('drinkware-sets.json', portionData.drinkwareSets));
    }

    await Promise.all(writes);

    return convertedPackagePath;
  }

  private async readWorkbook(filePath: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    return workbook;
  }

  private async readLocales(filePath: string): Promise<PkgV2Locale[]> {
    const workbook = await this.readWorkbook(filePath);
    const sheet = getSheetRequired(workbook, XLSX_SHEET_NAMES.locales, 'locales.xlsx');
    const headerIndices = getHeaderIndices(sheet);
    const locales: PkgV2Locale[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.id));
      if (!id)
        return;

      locales.push({
        id,
        englishName: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.englishName)),
        localName: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.localName)),
        respondentLanguage: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.respondentLanguage)),
        adminLanguage: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.adminLanguage)),
        flagCode: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.flagCode)),
        textDirection: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.textDirection)) as PkgV2Locale['textDirection'],
        foodIndexLanguageBackendId: cellAsOptionalString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.locales.foodIndexLanguageBackendId)),
      });
    });

    return locales;
  }

  private async readFoods(filePath: string, fileName: string): Promise<PkgV2Food[]> {
    const workbook = await this.readWorkbook(filePath);
    const sheet = getSheetRequired(workbook, XLSX_SHEET_NAMES.foodsMasterList, fileName);
    const headerIndices = getHeaderIndices(sheet);
    const foods: PkgV2Food[] = [];
    const foodsByCode = new Map<string, PkgV2Food>();

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.code));
      if (!code)
        return;

      const action = getOptionalCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.action);
      if (action && cellAsString(action).toLowerCase() === 'delete')
        return;

      const food: PkgV2Food = {
        code,
        name: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.name)),
        englishName: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.englishName)),
        parentCategories: splitList(cellAsOptionalString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.parentCategories))),
        thumbnailPath: cellAsOptionalString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.foodsMasterList.thumbnailPath)),
        alternativeNames: {},
        nutrientTableCodes: {},
        attributes: {},
        portionSize: [],
        associatedFoods: [],
        brandNames: [],
      };

      foods.push(food);
      foodsByCode.set(code, food);
    });

    this.readAlternativeNames(workbook.getWorksheet(XLSX_SHEET_NAMES.altNames), foodsByCode);
    this.readNutrientMapping(workbook.getWorksheet(XLSX_SHEET_NAMES.nutrientMapping), foodsByCode);
    this.readTags(workbook.getWorksheet(XLSX_SHEET_NAMES.tags), foodsByCode);
    this.readBrands(workbook.getWorksheet(XLSX_SHEET_NAMES.brands), foodsByCode);
    this.readAssociatedFoods(workbook.getWorksheet(XLSX_SHEET_NAMES.associatedFoods), foodsByCode);
    this.readAttributes(workbook.getWorksheet(XLSX_SHEET_NAMES.attributes), foodsByCode);
    this.readPortionSizeMethods(workbook.getWorksheet(XLSX_SHEET_NAMES.portionSize), foodsByCode, 'food');
    this.readStandardPortions(workbook.getWorksheet(XLSX_SHEET_NAMES.standardUnits), foodsByCode);
    this.readParentPortions(workbook.getWorksheet(XLSX_SHEET_NAMES.parentFoodPortion), foodsByCode);

    return foods;
  }

  private async readCategories(filePath: string, fileName: string): Promise<PkgV2Category[]> {
    const workbook = await this.readWorkbook(filePath);
    const sheet = getSheetRequired(workbook, XLSX_SHEET_NAMES.categoriesMasterList, fileName);
    const headerIndices = getHeaderIndices(sheet);
    const categories: PkgV2Category[] = [];
    const categoriesByCode = new Map<string, PkgV2Category>();

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.categoriesMasterList.code));
      if (!code)
        return;

      const category: PkgV2Category = {
        code,
        name: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.categoriesMasterList.name)),
        englishName: cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.categoriesMasterList.englishName)),
        hidden: cellAsBool(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.categoriesMasterList.hidden)) ?? false,
        parentCategories: splitList(cellAsOptionalString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.categoriesMasterList.parentCategories))),
        attributes: {},
        portionSize: [],
      };

      categories.push(category);
      categoriesByCode.set(code, category);
    });

    this.readAttributes(workbook.getWorksheet(XLSX_SHEET_NAMES.attributes), categoriesByCode);
    this.readPortionSizeMethods(workbook.getWorksheet(XLSX_SHEET_NAMES.portionSize), categoriesByCode, 'category');
    this.readStandardPortions(workbook.getWorksheet(XLSX_SHEET_NAMES.standardUnits), categoriesByCode);
    this.readParentPortions(workbook.getWorksheet(XLSX_SHEET_NAMES.parentFoodPortion), categoriesByCode);

    return categories;
  }

  private readAlternativeNames(sheet: ExcelJS.Worksheet | undefined, foodsByCode: Map<string, PkgV2Food>): void {
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(cellAsString(row.getCell(1)));
      const lang = cellAsString(row.getCell(2));
      const name = cellAsString(row.getCell(3));

      if (!food || !lang || !name)
        return;

      const existingNames = food.alternativeNames[lang];
      food.alternativeNames[lang] = existingNames ? [...existingNames, name] : [name];
    });
  }

  private readNutrientMapping(sheet: ExcelJS.Worksheet | undefined, foodsByCode: Map<string, PkgV2Food>): void {
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(cellAsString(row.getCell(1)));
      const nutrientTableId = cellAsString(row.getCell(2));
      const nutrientRecordId = cellAsString(row.getCell(3));

      if (food && nutrientTableId && nutrientRecordId)
        food.nutrientTableCodes[nutrientTableId] = nutrientRecordId;
    });
  }

  private readTags(sheet: ExcelJS.Worksheet | undefined, itemsByCode: Map<string, FoodOrCategory>): void {
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const item = itemsByCode.get(cellAsString(row.getCell(1)));
      if (!item)
        return;

      const tags: string[] = [];
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          const tag = cellAsString(cell);
          if (tag)
            tags.push(tag);
        }
      });

      if (tags.length)
        item.tags = tags;
    });
  }

  private readBrands(sheet: ExcelJS.Worksheet | undefined, foodsByCode: Map<string, PkgV2Food>): void {
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(cellAsString(row.getCell(1)));
      const brand = cellAsString(row.getCell(2));

      if (food && brand)
        food.brandNames.push(brand);
    });
  }

  private readAssociatedFoods(sheet: ExcelJS.Worksheet | undefined, foodsByCode: Map<string, PkgV2Food>): void {
    const associatedFoodRecords = new Map<string, PkgV2AssociatedFood>();

    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = cellAsString(row.getCell(1));
      const food = foodsByCode.get(code);
      const lang = cellAsString(row.getCell(6));

      if (!food || !lang)
        return;

      const foodCode = cellAsOptionalString(row.getCell(2));
      const categoryCode = cellAsOptionalString(row.getCell(3));
      const multiple = cellAsBool(row.getCell(4));
      const linkAsMain = cellAsBool(row.getCell(5)) ?? false;
      const genericName = cellAsString(row.getCell(7));
      const promptText = cellAsString(row.getCell(8));
      const associatedFoodKey = foodCode
        ? `${code}.food.${foodCode}`
        : `${code}.cat.${categoryCode}`;
      let associatedFood = associatedFoodRecords.get(associatedFoodKey);

      if (!associatedFood) {
        associatedFood = {
          foodCode,
          categoryCode,
          multiple,
          linkAsMain,
          genericName: {},
          promptText: {},
          orderBy: String(food.associatedFoods.length + 1),
        };

        food.associatedFoods.push(associatedFood);
        associatedFoodRecords.set(associatedFoodKey, associatedFood);
      }

      associatedFood.genericName[lang] = genericName;
      associatedFood.promptText[lang] = promptText;
    });
  }

  private readAttributes(sheet: ExcelJS.Worksheet | undefined, itemsByCode: Map<string, FoodOrCategory>): void {
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const item = itemsByCode.get(cellAsString(row.getCell(1)));
      if (item)
        readAttributes(item.attributes, row);
    });
  }

  private readPortionSizeMethods(
    sheet: ExcelJS.Worksheet | undefined,
    itemsByCode: Map<string, FoodOrCategory>,
    _target: PortionTarget,
  ): void {
    const hasDirectWeight = new Set<string>();
    const hasUnknown = new Set<string>();

    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber <= 2 || isRowEmpty(row))
        return;

      const code = cellAsString(row.getCell(1));
      const item = itemsByCode.get(code);

      if (!item)
        return;

      if (cellAsBool(row.getCell(3)) && !hasDirectWeight.has(code)) {
        addPortionSizeMethod(item, {
          ...makeBasePsm('direct-weight', portionOrder(item)),
        });
        hasDirectWeight.add(code);
      }

      if (cellAsBool(row.getCell(4)) && !hasUnknown.has(code)) {
        addPortionSizeMethod(item, {
          ...makeBasePsm('unknown', portionOrder(item)),
          weight: null,
        });
        hasUnknown.add(code);
      }

      this.readPortionSizeSections(row, item);
    });
  }

  private readPortionSizeSections(row: ExcelJS.Row, item: FoodOrCategory): void {
    const addIfPopulated = (columns: number[], create: () => PkgV2PortionSizeMethod) => {
      if (columns.some(col => cellAsOptionalString(row.getCell(col)) !== undefined))
        addPortionSizeMethod(item, create());
    };

    addIfPopulated([5, 6, 7, 8, 9, 10], () => ({
      ...makeBasePsm('as-served', portionOrder(item), numberValue(row.getCell(7), 1), splitPathways(cellAsOptionalString(row.getCell(10)))),
      servingImageSet: cellAsString(row.getCell(5)),
      leftoversImageSet: cellAsOptionalString(row.getCell(6)),
      labels: cellAsBool(row.getCell(8)),
      multiple: cellAsBool(row.getCell(9)),
    }));

    addIfPopulated([11, 12, 13, 14], () => ({
      ...makeBasePsm('auto', portionOrder(item), numberValue(row.getCell(11), 1), splitPathways(cellAsOptionalString(row.getCell(14)))),
      mode: cellAsString(row.getCell(12)) as Extract<PkgV2PortionSizeMethod, { method: 'auto' }>['mode'],
      value: numberValue(row.getCell(13)),
    }));

    addIfPopulated([15, 16, 17, 18], () => ({
      ...makeBasePsm('guide-image', portionOrder(item), numberValue(row.getCell(16), 1), splitPathways(cellAsOptionalString(row.getCell(18)))),
      guideImageId: cellAsString(row.getCell(15)),
      labels: cellAsBool(row.getCell(17)),
    }));

    addIfPopulated([19, 20, 21, 22, 23, 24, 25], () => ({
      ...makeBasePsm('drink-scale', portionOrder(item), numberValue(row.getCell(20), 1), splitPathways(cellAsOptionalString(row.getCell(25)))),
      drinkwareId: cellAsString(row.getCell(19)),
      labels: cellAsBool(row.getCell(21)),
      multiple: cellAsBool(row.getCell(22)),
      initialFillLevel: numberValue(row.getCell(23)),
      skipFillLevel: cellAsBool(row.getCell(24)) ?? false,
    }));

    addIfPopulated([26, 27, 28, 29], () => ({
      ...makeBasePsm('cereal', portionOrder(item), numberValue(row.getCell(27), 1), splitPathways(cellAsOptionalString(row.getCell(29)))),
      type: cellAsString(row.getCell(26)) as Extract<PkgV2PortionSizeMethod, { method: 'cereal' }>['type'],
      labels: cellAsBool(row.getCell(28)),
    }));

    addIfPopulated([30, 31, 32], () => ({
      ...makeBasePsm('milk-on-cereal', portionOrder(item), numberValue(row.getCell(30), 1), splitPathways(cellAsOptionalString(row.getCell(32)))),
      labels: cellAsBool(row.getCell(31)),
    }));

    addIfPopulated([33, 34, 35], () => ({
      ...makeBasePsm('pizza', portionOrder(item), numberValue(row.getCell(33), 1), splitPathways(cellAsOptionalString(row.getCell(35)))),
      labels: cellAsBool(row.getCell(34)),
    }));

    addIfPopulated([36, 37, 38], () => ({
      ...makeBasePsm('pizza-v2', portionOrder(item), numberValue(row.getCell(36), 1), splitPathways(cellAsOptionalString(row.getCell(38)))),
      labels: cellAsBool(row.getCell(37)),
    }));
  }

  private readStandardPortions(sheet: ExcelJS.Worksheet | undefined, itemsByCode: Map<string, FoodOrCategory>): void {
    const drafts = new Map<string, StandardPortionDraft>();

    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = cellAsString(row.getCell(1));
      const option = cellAsString(row.getCell(2));
      const item = itemsByCode.get(code);

      if (!item || !option)
        return;

      const key = `${code}:${option}`;
      const existing = drafts.get(key);
      const draft = existing ?? {
        ...makeBasePsm('standard-portion', portionOrder(item), numberValue(row.getCell(4), 1)),
        description: cellAsString(row.getCell(3)),
        units: [] as StandardPortionDraft['units'],
      };

      draft.units.push({
        name: cellAsString(row.getCell(5)),
        weight: numberValue(row.getCell(6)),
        omitFoodDescription: cellAsBool(row.getCell(7)) ?? false,
        inlineEstimateIn: cellAsOptionalString(row.getCell(8)),
        inlineHowMany: cellAsOptionalString(row.getCell(9)),
      });

      if (!existing) {
        drafts.set(key, draft);
        addPortionSizeMethod(item, draft);
      }
    });
  }

  private readParentPortions(sheet: ExcelJS.Worksheet | undefined, itemsByCode: Map<string, FoodOrCategory>): void {
    const drafts = new Map<string, MilkInHotDrinkDraft | ParentFoodPortionDraft>();

    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = cellAsString(row.getCell(1));
      const option = cellAsString(row.getCell(2));
      const method = cellAsString(row.getCell(3));
      const item = itemsByCode.get(code);
      const label = cellAsString(row.getCell(9));

      if (!item || !option || !label)
        return;

      const key = `${code}:${option}:${method}`;
      let draft = drafts.get(key);

      if (!draft) {
        if (method === 'milk-in-a-hot-drink') {
          const newDraft: MilkInHotDrinkDraft = {
            ...makeBasePsm('milk-in-a-hot-drink', portionOrder(item), numberValue(row.getCell(5), 1)),
            description: cellAsString(row.getCell(4)),
            options: { en: [] as MilkInHotDrinkDraft['options']['en'] },
          };
          draft = newDraft;
        }
        else if (method === 'parent-food-portion') {
          const newDraft: ParentFoodPortionDraft = {
            ...makeBasePsm('parent-food-portion', portionOrder(item), numberValue(row.getCell(5), 1)),
            description: cellAsString(row.getCell(4)),
            options: { _default: { en: [] as ParentFoodPortionDraft['options']['_default']['en'] } },
          };
          draft = newDraft;
        }
        else {
          return;
        }

        drafts.set(key, draft);
        addPortionSizeMethod(item, draft);
      }

      const language = cellAsString(row.getCell(8)) || 'en';
      const optionValue = {
        value: numberValue(row.getCell(7)),
        label,
        shortLabel: cellAsOptionalString(row.getCell(10)),
      };

      if (draft.method === 'milk-in-a-hot-drink') {
        draft.options[language] = [...(draft.options[language] ?? []), optionValue];
      }
      else {
        const category = cellAsOptionalString(row.getCell(6)) ?? '_default';
        draft.options[category] = draft.options[category] ?? { en: [] };
        draft.options[category][language] = [...(draft.options[category][language] ?? []), optionValue];
      }
    });
  }

  private async readSynonymSets(filePath: string): Promise<Record<string, PkgV2SynonymSet[]>> {
    const workbook = await this.readWorkbook(filePath);
    const sheet = getSheetRequired(workbook, XLSX_SHEET_NAMES.synonymSets, 'synonym-sets.xlsx');
    const headerIndices = getHeaderIndices(sheet);
    const synonymSets: Record<string, PkgV2SynonymSet[]> = {};

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const locale = cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.synonymSets.locale));
      const synonyms = cellAsString(getCellByHeader(row, headerIndices, XLSX_COLUMN_NAMES.synonymSets.synonyms)).split(/\s+/).filter(Boolean);

      if (!locale || !synonyms.length)
        return;

      synonymSets[locale] = [...(synonymSets[locale] ?? []), synonyms] as PkgV2SynonymSet[];
    });

    return synonymSets;
  }

  private async readPortionReferenceData(filePath: string): Promise<{
    asServedSets: PkgV2AsServedSet[];
    imageMaps: PkgV2ImageMap[];
    guideImages: PkgV2GuideImage[];
    drinkwareSets: PkgV2DrinkwareSet[];
  }> {
    const workbook = await this.readWorkbook(filePath);

    return {
      asServedSets: this.readAsServedSets(workbook),
      imageMaps: this.readImageMaps(workbook),
      guideImages: this.readGuideImages(workbook),
      drinkwareSets: this.readDrinkwareSets(workbook),
    };
  }

  private readAsServedSets(workbook: ExcelJS.Workbook): PkgV2AsServedSet[] {
    const setsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.asServedSets);
    const imagesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.asServedImages);
    const sets: PkgV2AsServedSet[] = [];
    const setsById = new Map<string, PkgV2AsServedSet>();

    setsSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = cellAsString(row.getCell(1));
      if (!id)
        return;

      const set: PkgV2AsServedSet = {
        id,
        description: cellAsString(row.getCell(2)),
        selectionImagePath: cellAsString(row.getCell(3)),
        label: parseJson(cellAsOptionalString(row.getCell(4)), null),
        images: [],
      };

      sets.push(set);
      setsById.set(id, set);
    });

    imagesSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const set = setsById.get(cellAsString(row.getCell(1)));
      if (!set)
        return;

      set.images.push({
        imagePath: cellAsString(row.getCell(2)),
        weight: numberValue(row.getCell(3)),
        imageKeywords: splitList(cellAsOptionalString(row.getCell(4))),
        label: parseJson(cellAsOptionalString(row.getCell(5)), null),
      });
    });

    return sets;
  }

  private readImageMaps(workbook: ExcelJS.Workbook): PkgV2ImageMap[] {
    const mapsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.imageMaps);
    const objectsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.imageMapObjects);
    const imageMaps: PkgV2ImageMap[] = [];
    const imageMapsById = new Map<string, PkgV2ImageMap>();

    mapsSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = cellAsString(row.getCell(1));
      if (!id)
        return;

      const imageMap: PkgV2ImageMap = {
        id,
        description: cellAsString(row.getCell(2)),
        baseImagePath: cellAsString(row.getCell(3)),
        objects: {},
      };

      imageMaps.push(imageMap);
      imageMapsById.set(id, imageMap);
    });

    objectsSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const imageMap = imageMapsById.get(cellAsString(row.getCell(1)));
      const objectId = numberValue(row.getCell(2), Number.NaN);

      if (!imageMap || Number.isNaN(objectId))
        return;

      imageMap.objects[objectId] = {
        description: cellAsString(row.getCell(3)),
        navigationIndex: numberValue(row.getCell(4)),
        outlineCoordinates: parseJson(cellAsOptionalString(row.getCell(5)), []),
      };
    });

    return imageMaps;
  }

  private readGuideImages(workbook: ExcelJS.Workbook): PkgV2GuideImage[] {
    const guideImagesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.guideImages);
    const objectsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.guideImageObjects);
    const guideImages: PkgV2GuideImage[] = [];
    const guideImagesById = new Map<string, PkgV2GuideImage>();

    guideImagesSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = cellAsString(row.getCell(1));
      if (!id)
        return;

      const guideImage: PkgV2GuideImage = {
        id,
        description: cellAsString(row.getCell(2)),
        imageMapId: cellAsString(row.getCell(3)),
        label: parseJson(cellAsOptionalString(row.getCell(4)), {}),
        objectWeights: {},
      };

      guideImages.push(guideImage);
      guideImagesById.set(id, guideImage);
    });

    objectsSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const guideImage = guideImagesById.get(cellAsString(row.getCell(1)));
      const objectId = numberValue(row.getCell(2), Number.NaN);

      if (guideImage && !Number.isNaN(objectId))
        guideImage.objectWeights[objectId] = numberValue(row.getCell(3));
    });

    return guideImages;
  }

  private readDrinkwareSets(workbook: ExcelJS.Workbook): PkgV2DrinkwareSet[] {
    const setsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.drinkwareSets);
    const scalesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.drinkwareScales);
    const drinkwareSets: PkgV2DrinkwareSet[] = [];
    const drinkwareSetsById = new Map<string, PkgV2DrinkwareSet>();

    setsSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = cellAsString(row.getCell(1));
      if (!id)
        return;

      const drinkwareSet: PkgV2DrinkwareSet = {
        id,
        description: cellAsString(row.getCell(2)),
        selectionImageMapId: cellAsString(row.getCell(3)),
        label: parseJson(cellAsOptionalString(row.getCell(4)), {}),
        scales: {},
      };

      drinkwareSets.push(drinkwareSet);
      drinkwareSetsById.set(id, drinkwareSet);
    });

    scalesSheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const drinkwareSet = drinkwareSetsById.get(cellAsString(row.getCell(1)));
      const choiceId = numberValue(row.getCell(2), Number.NaN);
      const version = numberValue(row.getCell(3));

      if (!drinkwareSet || Number.isNaN(choiceId))
        return;

      if (version === 1) {
        drinkwareSet.scales[choiceId] = {
          version: 1,
          baseImagePath: cellAsString(row.getCell(4)),
          label: parseJson(cellAsOptionalString(row.getCell(5)), { label: '' }).label ?? '',
          width: numberValue(row.getCell(6)),
          height: numberValue(row.getCell(7)),
          emptyLevel: numberValue(row.getCell(8)),
          fullLevel: numberValue(row.getCell(9)),
          overlayImagePath: cellAsString(row.getCell(10)),
          volumeSamples: parseJson(cellAsOptionalString(row.getCell(13)), []),
        };
      }
      else {
        drinkwareSet.scales[choiceId] = {
          version: 2,
          baseImagePath: cellAsString(row.getCell(4)),
          label: parseJson(cellAsOptionalString(row.getCell(5)), {}),
          outlineCoordinates: parseJson(cellAsOptionalString(row.getCell(11)), []),
          volumeMethod: cellAsString(row.getCell(12)) as 'lookUpTable' | 'cylindrical',
          volumeSamples: parseJson(cellAsOptionalString(row.getCell(13)), []),
        };
      }
    });

    return drinkwareSets;
  }
}
