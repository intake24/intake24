import type { XlsxPackageMeta } from './package-meta';
import type {
  FileValidationErrorMessage,
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';
import type {
  XlsxHeaderSpec,
  XlsxValidationContext,
  XlsxValidationErrorKey,
} from './xlsx-worksheet-reader';
import type { Dictionary } from '@intake24/common/types';
import type { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkScaleV2, PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
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
import { autoPsmModes } from '@intake24/common/surveys';
import { cerealTypes } from '@intake24/common/types/package/foods';

import { getVerifiedOutputPath } from '../import/utils';
import { XLSX_COLUMN_NAMES, XLSX_FILE_NAMES, XLSX_SHEET_NAMES } from '../xlsx-format-constants';
import { validatePackageMeta } from './package-meta';
import { PackageValidationFileErrors } from './types';
import { writeJsonFile } from './utils';
import { getFileValidationErrorMessages, validateJsonFiles } from './validate-json-files';
import { XlsxWorkbookReader, XlsxWorksheetReader } from './xlsx-worksheet-reader';

type FoodOrCategory = PkgV2Food | PkgV2Category;
type PortionTarget = 'food' | 'category';
type PsmPathway = PkgV2PortionSizeMethod['pathways'][number];

type StandardPortionDraft = Extract<PkgV2PortionSizeMethod, { method: 'standard-portion' }>;
type MilkInHotDrinkDraft = Extract<PkgV2PortionSizeMethod, { method: 'milk-in-a-hot-drink' }>;
type ParentFoodPortionDraft = Extract<PkgV2PortionSizeMethod, { method: 'parent-food-portion' }>;
type XlsxValidationFileErrors = Record<string, FileValidationErrorMessage[]>;

const DEFAULT_PATHWAYS: PsmPathway[] = ['search'];
const VALID_PATHWAYS = new Set<PsmPathway>(['addon', 'afp', 'recipe', 'search']);
const WHITESPACE_REGEX = /\s+/;
const AUTO_MODES = new Set(autoPsmModes);
const CEREAL_TYPES = new Set(cerealTypes);
const VOLUME_METHODS = new Set(['lookUpTable', 'cylindrical'] as const);

const requiredHeader = (name: string, key?: string): XlsxHeaderSpec => ({ name, key, optional: false });
const optionalHeader = (name: string, key?: string): XlsxHeaderSpec => ({ name, key, optional: true });
const tagHeaders = Array.from({ length: 12 }, (_, index) => XLSX_COLUMN_NAMES.tags.tag(index + 1));
const portionSizeHeader = (key: keyof typeof XLSX_COLUMN_NAMES.portionSize): XlsxHeaderSpec => requiredHeader(XLSX_COLUMN_NAMES.portionSize[key], key);

function portionSizeHeaders(codeHeader: string, nameHeader: string): XlsxHeaderSpec[] {
  return [
    requiredHeader(codeHeader),
    requiredHeader(nameHeader),
    portionSizeHeader('enterWeightOption'),
    portionSizeHeader('enterWeightDisplayOrder'),
    portionSizeHeader('dontKnowOption'),
    portionSizeHeader('dontKnowDisplayOrder'),
    portionSizeHeader('asServedServingImageSetId'),
    portionSizeHeader('asServedLeftoversImageSetId'),
    portionSizeHeader('asServedDescription'),
    portionSizeHeader('asServedDisplayOrder'),
    portionSizeHeader('asServedConversionFactor'),
    portionSizeHeader('asServedShowLabels'),
    portionSizeHeader('asServedMultipleOption'),
    portionSizeHeader('asServedPathways'),
    portionSizeHeader('autoDescription'),
    portionSizeHeader('autoDisplayOrder'),
    portionSizeHeader('autoConversionFactor'),
    portionSizeHeader('autoMode'),
    portionSizeHeader('autoValue'),
    portionSizeHeader('autoPathways'),
    portionSizeHeader('guideImageId'),
    portionSizeHeader('guideImageDescription'),
    portionSizeHeader('guideImageDisplayOrder'),
    portionSizeHeader('guideImageConversionFactor'),
    portionSizeHeader('guideImageShowLabels'),
    portionSizeHeader('guideImageVisibility'),
    portionSizeHeader('drinkScaleDrinkwareSetId'),
    portionSizeHeader('drinkScaleDescription'),
    portionSizeHeader('drinkScaleDisplayOrder'),
    portionSizeHeader('drinkScaleConversionFactor'),
    portionSizeHeader('drinkScaleShowLabels'),
    portionSizeHeader('drinkScaleMultipleOption'),
    portionSizeHeader('drinkScaleInitialFillLevel'),
    portionSizeHeader('drinkScaleSkipFillLevel'),
    portionSizeHeader('drinkScalePathways'),
    portionSizeHeader('cerealType'),
    portionSizeHeader('cerealDescription'),
    portionSizeHeader('cerealDisplayOrder'),
    portionSizeHeader('cerealConversionFactor'),
    portionSizeHeader('cerealShowLabels'),
    portionSizeHeader('cerealPathways'),
    portionSizeHeader('milkOnCerealDescription'),
    portionSizeHeader('milkOnCerealDisplayOrder'),
    portionSizeHeader('milkOnCerealConversionFactor'),
    portionSizeHeader('milkOnCerealShowLabels'),
    portionSizeHeader('milkOnCerealPathways'),
    portionSizeHeader('pizzaDescription'),
    portionSizeHeader('pizzaDisplayOrder'),
    portionSizeHeader('pizzaConversionFactor'),
    portionSizeHeader('pizzaShowLabels'),
    portionSizeHeader('pizzaPathways'),
    portionSizeHeader('pizzaV2Description'),
    portionSizeHeader('pizzaV2DisplayOrder'),
    portionSizeHeader('pizzaV2ConversionFactor'),
    portionSizeHeader('pizzaV2ShowLabels'),
    portionSizeHeader('pizzaV2Pathways'),
  ];
}

type PortionSizeColumns = ReturnType<typeof portionSizeColumnIndices>;

function portionSizeColumnIndices(reader: XlsxWorksheetReader, codeColumnName: string) {
  const column = (key: keyof typeof XLSX_COLUMN_NAMES.portionSize) => reader.getColumnIndex(key);

  return {
    code: reader.getColumnIndex(codeColumnName),
    enterWeightOption: column('enterWeightOption'),
    enterWeightDisplayOrder: column('enterWeightDisplayOrder'),
    dontKnowOption: column('dontKnowOption'),
    dontKnowDisplayOrder: column('dontKnowDisplayOrder'),
    asServedServingImageSetId: column('asServedServingImageSetId'),
    asServedLeftoversImageSetId: column('asServedLeftoversImageSetId'),
    asServedDescription: column('asServedDescription'),
    asServedDisplayOrder: column('asServedDisplayOrder'),
    asServedConversionFactor: column('asServedConversionFactor'),
    asServedShowLabels: column('asServedShowLabels'),
    asServedMultipleOption: column('asServedMultipleOption'),
    asServedPathways: column('asServedPathways'),
    autoDescription: column('autoDescription'),
    autoDisplayOrder: column('autoDisplayOrder'),
    autoConversionFactor: column('autoConversionFactor'),
    autoMode: column('autoMode'),
    autoValue: column('autoValue'),
    autoPathways: column('autoPathways'),
    guideImageId: column('guideImageId'),
    guideImageDescription: column('guideImageDescription'),
    guideImageDisplayOrder: column('guideImageDisplayOrder'),
    guideImageConversionFactor: column('guideImageConversionFactor'),
    guideImageShowLabels: column('guideImageShowLabels'),
    guideImageVisibility: column('guideImageVisibility'),
    drinkScaleDrinkwareSetId: column('drinkScaleDrinkwareSetId'),
    drinkScaleDescription: column('drinkScaleDescription'),
    drinkScaleDisplayOrder: column('drinkScaleDisplayOrder'),
    drinkScaleConversionFactor: column('drinkScaleConversionFactor'),
    drinkScaleShowLabels: column('drinkScaleShowLabels'),
    drinkScaleMultipleOption: column('drinkScaleMultipleOption'),
    drinkScaleInitialFillLevel: column('drinkScaleInitialFillLevel'),
    drinkScaleSkipFillLevel: column('drinkScaleSkipFillLevel'),
    drinkScalePathways: column('drinkScalePathways'),
    cerealType: column('cerealType'),
    cerealDescription: column('cerealDescription'),
    cerealDisplayOrder: column('cerealDisplayOrder'),
    cerealConversionFactor: column('cerealConversionFactor'),
    cerealShowLabels: column('cerealShowLabels'),
    cerealPathways: column('cerealPathways'),
    milkOnCerealDescription: column('milkOnCerealDescription'),
    milkOnCerealDisplayOrder: column('milkOnCerealDisplayOrder'),
    milkOnCerealConversionFactor: column('milkOnCerealConversionFactor'),
    milkOnCerealShowLabels: column('milkOnCerealShowLabels'),
    milkOnCerealPathways: column('milkOnCerealPathways'),
    pizzaDescription: column('pizzaDescription'),
    pizzaDisplayOrder: column('pizzaDisplayOrder'),
    pizzaConversionFactor: column('pizzaConversionFactor'),
    pizzaShowLabels: column('pizzaShowLabels'),
    pizzaPathways: column('pizzaPathways'),
    pizzaV2Description: column('pizzaV2Description'),
    pizzaV2DisplayOrder: column('pizzaV2DisplayOrder'),
    pizzaV2ConversionFactor: column('pizzaV2ConversionFactor'),
    pizzaV2ShowLabels: column('pizzaV2ShowLabels'),
    pizzaV2Pathways: column('pizzaV2Pathways'),
  };
}

function splitList(value: string | undefined): string[] {
  return value?.split(';').map(item => item.trim()).filter(Boolean) ?? [];
}

function splitPathways(value: string | undefined): PsmPathway[] {
  const pathways = splitList(value).filter((item): item is PsmPathway => VALID_PATHWAYS.has(item as PsmPathway));
  return pathways.length ? pathways : [...DEFAULT_PATHWAYS];
}

function isRowEmpty(row: ExcelJS.Row): boolean {
  return !row.values || (Array.isArray(row.values) && row.values.length <= 1);
}

function addPortionSizeMethod(item: FoodOrCategory, psm: PkgV2PortionSizeMethod): void {
  item.portionSize.push(psm);
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

type AttributeColumns = ReturnType<typeof attributeColumnIndices>;

function attributeColumnIndices(reader: XlsxWorksheetReader) {
  return reader.getColumnIndices(XLSX_COLUMN_NAMES.attributes);
}

function readAttributes(att: PkgV2InheritableAttributes, reader: XlsxWorksheetReader, rowNumber: number, columns: AttributeColumns) {
  const readyMealOption = reader.cellAsBool(rowNumber, columns.readyMealOption);
  const reasonableAmount = reader.cellAsOptionalString(rowNumber, columns.reasonableAmount);
  const sameAsBeforeOption = reader.cellAsBool(rowNumber, columns.sameAsBeforeOption);
  const useInRecipes = decodeUseInRecipes(reader.cellAsOptionalString(rowNumber, columns.useInRecipes));

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

// The "Display order" cell carries the 1-based position the method should have in the portion
// size array. Fall back to the insertion order when it is missing or invalid.
function readDisplayOrder(reader: XlsxWorksheetReader, rowNumber: number, column: number, item: FoodOrCategory): number {
  const raw = reader.cellAsOptionalString(rowNumber, column);
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : portionOrder(item);
}

// Portion size methods are read across several sheets, so the array reflects read order. Re-sort
// it by the "Display order" (orderBy) captured from the spreadsheet to restore the intended order.
function sortPortionSizeMethods(item: FoodOrCategory): void {
  item.portionSize.sort((left, right) => Number(left.orderBy) - Number(right.orderBy));
}

export class Intake24XlsxPackageHandler implements PackageHandler {
  private readonly context: PackageHandlerContext;
  private sourcePath?: string;
  private convertedPackagePath?: string;
  private packageMeta?: XlsxPackageMeta;
  private fileErrors: XlsxValidationFileErrors = {};

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

  private validationPath(context: XlsxValidationContext): string {
    return [
      'sheetName' in context ? context.sheetName : undefined,
      'rowNumber' in context ? `row ${context.rowNumber}` : undefined,
      'columnIndex' in context ? context.columnIndex : undefined,
    ].filter(Boolean).join('.');
  }

  private addValidationError(
    context: XlsxValidationContext,
    key: XlsxValidationErrorKey,
    params?: Dictionary,
  ): void {
    const errors = this.fileErrors[context.fileName] ?? [];

    errors.push({
      key: `io.verification.xlsx.${key}`,
      params: {
        ...context,
        path: this.validationPath(context),
        ...params,
      },
    });

    this.fileErrors[context.fileName] = errors;
  }

  private hasValidationErrors(): boolean {
    return Object.keys(this.fileErrors).length > 0;
  }

  private async convertPackage(sourcePath: string, uploadDir: string, fileId: string): Promise<string> {
    const convertedPackagePath = getVerifiedOutputPath(uploadDir, fileId);
    const files = await fs.readdir(sourcePath);
    const packageMeta = this.packageMeta;
    const writes: Promise<void>[] = [];

    this.fileErrors = {};

    if (!packageMeta)
      throw new Error('Package metadata not loaded');

    await fs.mkdir(convertedPackagePath, { recursive: true });

    const writeJson = (filename: string, data: unknown) => writeJsonFile(convertedPackagePath, filename, data);

    writes.push(writeJson('package.json', {
      version: '2.0',
      format: 'json',
    }));

    if (files.includes(XLSX_FILE_NAMES.locales))
      writes.push(writeJson('locales.json', await this.readLocales(sourcePath)));

    const foodWorkbooks = Object.entries(packageMeta.workbookPaths?.foods ?? {});

    if (foodWorkbooks.length) {
      const foods: Record<string, PkgV2Food[]> = {};

      for (const [localeId, workbookPath] of foodWorkbooks) {
        foods[localeId] = await this.readFoods(
          sourcePath,
          workbookPath,
        );
      }

      writes.push(writeJson('foods.json', foods));
    }

    const categoryWorkbooks = Object.entries(packageMeta.workbookPaths?.categories ?? {});

    if (categoryWorkbooks.length) {
      const categories: Record<string, PkgV2Category[]> = {};

      for (const [localeId, workbookPath] of categoryWorkbooks) {
        categories[localeId] = await this.readCategories(
          sourcePath,
          workbookPath,
        );
      }

      writes.push(writeJson('categories.json', categories));
    }

    if (files.includes(XLSX_FILE_NAMES.synonymSets))
      writes.push(writeJson('synonym-sets.json', await this.readSynonymSets(sourcePath)));

    if (files.includes(XLSX_FILE_NAMES.portionSize)) {
      const portionData = await this.readPortionReferenceData(sourcePath);

      if (portionData.asServedSets.length)
        writes.push(writeJson('as-served-sets.json', portionData.asServedSets));
      if (portionData.imageMaps.length)
        writes.push(writeJson('image-maps.json', portionData.imageMaps));
      if (portionData.guideImages.length)
        writes.push(writeJson('guide-images.json', portionData.guideImages));
      if (portionData.drinkwareSets.length)
        writes.push(writeJson('drinkware-sets.json', portionData.drinkwareSets));
    }

    if (this.hasValidationErrors())
      throw new PackageValidationFileErrors(this.fileErrors);

    await Promise.all(writes);

    return convertedPackagePath;
  }

  private static readonly foodActionRegex = /^(retain|delete|amend|add)$/i;
  private static readonly textDirectionRegex = /^(ltr|rtl)$/;

  private async readLocales(sourcePath: string): Promise<PkgV2Locale[]> {
    const fileName = XLSX_FILE_NAMES.locales;
    const workbookReader = await XlsxWorkbookReader.fromFile(sourcePath, fileName, this.addValidationError.bind(this));
    const locales: PkgV2Locale[] = [];

    const reader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.locales, [
      requiredHeader(XLSX_COLUMN_NAMES.locales.id),
      requiredHeader(XLSX_COLUMN_NAMES.locales.englishName),
      requiredHeader(XLSX_COLUMN_NAMES.locales.localName),
      requiredHeader(XLSX_COLUMN_NAMES.locales.respondentLanguage),
      requiredHeader(XLSX_COLUMN_NAMES.locales.adminLanguage),
      requiredHeader(XLSX_COLUMN_NAMES.locales.flagCode),
      requiredHeader(XLSX_COLUMN_NAMES.locales.textDirection),
      requiredHeader(XLSX_COLUMN_NAMES.locales.foodIndexLanguageBackendId),
    ]);

    if (!reader)
      return locales;

    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.locales);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = reader.cellAsNonEmptyString(rowNumber, columns.id);
      const englishName = reader.cellAsNonEmptyString(rowNumber, columns.englishName);
      const localName = reader.cellAsNonEmptyString(rowNumber, columns.localName);
      const respondentLanguage = reader.cellAsNonEmptyString(rowNumber, columns.respondentLanguage);
      const adminLanguage = reader.cellAsNonEmptyString(rowNumber, columns.adminLanguage);
      const flagCode = reader.cellAsNonEmptyString(rowNumber, columns.flagCode);
      const textDirection = reader.cellAsRegexString(rowNumber, columns.textDirection, Intake24XlsxPackageHandler.textDirectionRegex, 'ltr, rtl');

      if (!id || !englishName || !localName || !respondentLanguage || !adminLanguage || !flagCode || !textDirection)
        return;

      locales.push({
        id,
        englishName,
        localName,
        respondentLanguage,
        adminLanguage,
        flagCode,
        textDirection: textDirection as PkgV2Locale['textDirection'],
        foodIndexLanguageBackendId: reader.cellAsOptionalString(rowNumber, columns.foodIndexLanguageBackendId),
      });
    });

    return locales;
  }

  private async readFoods(sourcePath: string, fileName: string): Promise<PkgV2Food[]> {
    const workbookReader = await XlsxWorkbookReader.fromFile(sourcePath, fileName, this.addValidationError.bind(this));
    const foods: PkgV2Food[] = [];
    const foodsByCode = new Map<string, PkgV2Food>();
    const deletedFoodCodes = new Set<string>();

    const reader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.foodsMasterList, [
      requiredHeader(XLSX_COLUMN_NAMES.foodsMasterList.code),
      optionalHeader(XLSX_COLUMN_NAMES.foodsMasterList.action),
      requiredHeader(XLSX_COLUMN_NAMES.foodsMasterList.name),
      requiredHeader(XLSX_COLUMN_NAMES.foodsMasterList.englishName),
      requiredHeader(XLSX_COLUMN_NAMES.foodsMasterList.parentCategories),
      requiredHeader(XLSX_COLUMN_NAMES.foodsMasterList.thumbnailPath),
    ]);

    if (!reader)
      return foods;

    const foodColumns = {
      code: reader.getColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.code),
      action: reader.getOptionalColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.action),
      name: reader.getColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.name),
      englishName: reader.getColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.englishName),
      parentCategories: reader.getColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.parentCategories),
      thumbnailPath: reader.getColumnIndex(XLSX_COLUMN_NAMES.foodsMasterList.thumbnailPath),
    };

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = reader.cellAsNonEmptyString(rowNumber, foodColumns.code);
      if (!code)
        return;

      if (foodColumns.action !== undefined) {
        const action = reader.cellAsRegexString(
          rowNumber,
          foodColumns.action,
          Intake24XlsxPackageHandler.foodActionRegex,
          'Retain, Delete, Amend, Add',
        );

        if (!action)
          return;

        if (action.toLowerCase() === 'delete') {
          deletedFoodCodes.add(code);
          return;
        }
      }

      const name = reader.cellAsNonEmptyString(rowNumber, foodColumns.name);
      const englishName = reader.cellAsNonEmptyString(rowNumber, foodColumns.englishName);

      if (!name || !englishName)
        return;

      const food: PkgV2Food = {
        code,
        name,
        englishName,
        parentCategories: splitList(reader.cellAsOptionalString(rowNumber, foodColumns.parentCategories)),
        thumbnailPath: reader.cellAsOptionalString(rowNumber, foodColumns.thumbnailPath),
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

    const altNamesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.altNames, [
      requiredHeader(XLSX_COLUMN_NAMES.altNames.code),
      requiredHeader(XLSX_COLUMN_NAMES.altNames.language),
      requiredHeader(XLSX_COLUMN_NAMES.altNames.alternativeName),
    ]);
    const nutrientMappingReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.nutrientMapping, [
      requiredHeader(XLSX_COLUMN_NAMES.nutrientMapping.code),
      requiredHeader(XLSX_COLUMN_NAMES.nutrientMapping.nutrientTableId),
      requiredHeader(XLSX_COLUMN_NAMES.nutrientMapping.nutrientRecordId),
    ]);
    const tagsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.tags, [
      requiredHeader(XLSX_COLUMN_NAMES.tags.code),
      ...tagHeaders.map(header => requiredHeader(header)),
    ]);
    const brandsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.brands, [
      requiredHeader(XLSX_COLUMN_NAMES.brands.code),
      requiredHeader(XLSX_COLUMN_NAMES.brands.brandName),
    ]);
    const associatedFoodsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.associatedFoods, [
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.code),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.associatedFoodCode),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.associatedCategoryCode),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.multiple),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.linkAsMain),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.language),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.genericName),
      requiredHeader(XLSX_COLUMN_NAMES.associatedFoods.promptText),
    ]);
    const attributesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.attributes, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.foodCode),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.readyMealOption),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.reasonableAmount),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.sameAsBeforeOption),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.useInRecipes),
    ]);
    const portionSizeReader = workbookReader.getWorksheetReader(
      XLSX_SHEET_NAMES.portionSize,
      portionSizeHeaders(XLSX_COLUMN_NAMES.portionSize.foodCode, XLSX_COLUMN_NAMES.portionSize.foodName),
      2,
    );
    const standardUnitsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.standardUnits, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.foodCode),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.portionSizeOption),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.displayOrder),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.conversionFactor),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.standardUnitId),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.unitWeight),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.omitFoodName),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.inlineEstimateIn),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.inlineHowMany),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.pathways),
    ]);
    const parentFoodPortionReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.parentFoodPortion, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.foodCode),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.portionSizeOption),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.methodType),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.displayOrder),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.conversionFactor),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.category),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.parentPortion),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.language),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.label),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.shortLabel),
    ]);

    if (altNamesReader)
      this.readAlternativeNames(altNamesReader, foodsByCode);
    if (nutrientMappingReader)
      this.readNutrientMapping(nutrientMappingReader, foodsByCode);
    if (tagsReader)
      this.readTags(tagsReader, foodsByCode);
    if (brandsReader)
      this.readBrands(brandsReader, foodsByCode);
    if (associatedFoodsReader)
      this.readAssociatedFoods(associatedFoodsReader, foodsByCode, deletedFoodCodes);
    if (attributesReader)
      this.readAttributes(attributesReader, foodsByCode, XLSX_COLUMN_NAMES.portionSize.foodCode);
    if (portionSizeReader)
      this.readPortionSizeMethods(portionSizeReader, foodsByCode, 'food', XLSX_COLUMN_NAMES.portionSize.foodCode);
    if (standardUnitsReader)
      this.readStandardPortions(standardUnitsReader, foodsByCode, XLSX_COLUMN_NAMES.portionSize.foodCode);
    if (parentFoodPortionReader)
      this.readParentPortions(parentFoodPortionReader, foodsByCode, XLSX_COLUMN_NAMES.portionSize.foodCode);

    foods.forEach(sortPortionSizeMethods);

    return foods;
  }

  private async readCategories(sourcePath: string, fileName: string): Promise<PkgV2Category[]> {
    const workbookReader = await XlsxWorkbookReader.fromFile(sourcePath, fileName, this.addValidationError.bind(this));
    const categories: PkgV2Category[] = [];
    const categoriesByCode = new Map<string, PkgV2Category>();

    const reader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.categoriesMasterList, [
      requiredHeader(XLSX_COLUMN_NAMES.categoriesMasterList.code),
      requiredHeader(XLSX_COLUMN_NAMES.categoriesMasterList.name),
      requiredHeader(XLSX_COLUMN_NAMES.categoriesMasterList.englishName),
      requiredHeader(XLSX_COLUMN_NAMES.categoriesMasterList.hidden),
      requiredHeader(XLSX_COLUMN_NAMES.categoriesMasterList.parentCategories),
    ]);

    if (!reader)
      return categories;

    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.categoriesMasterList);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = reader.cellAsNonEmptyString(rowNumber, columns.code);
      const name = reader.cellAsNonEmptyString(rowNumber, columns.name);
      const englishName = reader.cellAsNonEmptyString(rowNumber, columns.englishName);

      if (!code || !name || !englishName)
        return;

      const category: PkgV2Category = {
        code,
        name,
        englishName,
        hidden: reader.cellAsBool(rowNumber, columns.hidden) ?? false,
        parentCategories: splitList(reader.cellAsOptionalString(rowNumber, columns.parentCategories)),
        attributes: {},
        portionSize: [],
      };

      categories.push(category);
      categoriesByCode.set(code, category);
    });

    const attributesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.attributes, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.categoryCode),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.readyMealOption),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.reasonableAmount),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.sameAsBeforeOption),
      requiredHeader(XLSX_COLUMN_NAMES.attributes.useInRecipes),
    ]);
    const portionSizeReader = workbookReader.getWorksheetReader(
      XLSX_SHEET_NAMES.portionSize,
      portionSizeHeaders(XLSX_COLUMN_NAMES.portionSize.categoryCode, XLSX_COLUMN_NAMES.portionSize.categoryName),
      2,
    );
    const standardUnitsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.standardUnits, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.categoryCode),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.portionSizeOption),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.displayOrder),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.conversionFactor),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.standardUnitId),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.unitWeight),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.omitFoodName),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.inlineEstimateIn),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.inlineHowMany),
      requiredHeader(XLSX_COLUMN_NAMES.standardUnits.pathways),
    ]);
    const parentFoodPortionReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.parentFoodPortion, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSize.categoryCode),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.portionSizeOption),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.methodType),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.displayOrder),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.conversionFactor),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.category),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.parentPortion),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.language),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.label),
      requiredHeader(XLSX_COLUMN_NAMES.parentFoodPortion.shortLabel),
    ]);

    if (attributesReader)
      this.readAttributes(attributesReader, categoriesByCode, XLSX_COLUMN_NAMES.portionSize.categoryCode);
    if (portionSizeReader)
      this.readPortionSizeMethods(portionSizeReader, categoriesByCode, 'category', XLSX_COLUMN_NAMES.portionSize.categoryCode);
    if (standardUnitsReader)
      this.readStandardPortions(standardUnitsReader, categoriesByCode, XLSX_COLUMN_NAMES.portionSize.categoryCode);
    if (parentFoodPortionReader)
      this.readParentPortions(parentFoodPortionReader, categoriesByCode, XLSX_COLUMN_NAMES.portionSize.categoryCode);

    categories.forEach(sortPortionSizeMethods);

    return categories;
  }

  private readAlternativeNames(reader: XlsxWorksheetReader, foodsByCode: Map<string, PkgV2Food>): void {
    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.altNames);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(reader.cellAsString(rowNumber, columns.code));
      const lang = reader.cellAsString(rowNumber, columns.language);
      const name = reader.cellAsString(rowNumber, columns.alternativeName);

      if (!food || !lang || !name)
        return;

      (food.alternativeNames[lang] ??= []).push(name);
    });
  }

  private readNutrientMapping(reader: XlsxWorksheetReader, foodsByCode: Map<string, PkgV2Food>): void {
    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.nutrientMapping);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(reader.cellAsString(rowNumber, columns.code));
      const nutrientTableId = reader.cellAsString(rowNumber, columns.nutrientTableId);
      const nutrientRecordId = reader.cellAsString(rowNumber, columns.nutrientRecordId);

      if (food && nutrientTableId && nutrientRecordId)
        food.nutrientTableCodes[nutrientTableId] = nutrientRecordId;
    });
  }

  private readTags(reader: XlsxWorksheetReader, itemsByCode: Map<string, FoodOrCategory>): void {
    const codeColumn = reader.getColumnIndex(XLSX_COLUMN_NAMES.tags.code);
    const tagColumns = tagHeaders.map(header => reader.getColumnIndex(header));

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const item = itemsByCode.get(reader.cellAsString(rowNumber, codeColumn));
      if (!item)
        return;

      const tags: string[] = [];
      for (const column of tagColumns) {
        const tag = reader.cellAsString(rowNumber, column);
        if (tag)
          tags.push(tag);
      }

      if (tags.length)
        item.tags = tags;
    });
  }

  private readBrands(reader: XlsxWorksheetReader, foodsByCode: Map<string, PkgV2Food>): void {
    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.brands);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const food = foodsByCode.get(reader.cellAsString(rowNumber, columns.code));
      const brand = reader.cellAsString(rowNumber, columns.brandName);

      if (food && brand)
        food.brandNames.push(brand);
    });
  }

  private readAssociatedFoods(
    reader: XlsxWorksheetReader,
    foodsByCode: Map<string, PkgV2Food>,
    deletedFoodCodes: Set<string>,
  ): void {
    const associatedFoodRecords = new Map<string, PkgV2AssociatedFood>();
    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.associatedFoods);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = reader.cellAsNonEmptyString(rowNumber, columns.code);
      if (code && deletedFoodCodes.has(code))
        return;

      const lang = reader.cellAsNonEmptyString(rowNumber, columns.language);
      const foodCode = reader.cellAsOptionalString(rowNumber, columns.associatedFoodCode);
      const categoryCode = reader.cellAsOptionalString(rowNumber, columns.associatedCategoryCode);
      const multiple = reader.cellAsBool(rowNumber, columns.multiple);
      const linkAsMain = reader.cellAsBool(rowNumber, columns.linkAsMain) ?? false;
      const genericName = reader.cellAsNonEmptyString(rowNumber, columns.genericName);
      const promptText = reader.cellAsNonEmptyString(rowNumber, columns.promptText);
      const foodRecord = code ? foodsByCode.get(code) : undefined;

      if (code && !foodRecord) {
        this.addValidationError(
          reader.cellContext(rowNumber, columns.code),
          'foodCodeNotFound',
          { foodCode: code },
        );
      }

      const associatedFoodInvalid = foodCode && (!foodsByCode.has(foodCode) || deletedFoodCodes.has(foodCode));

      if (associatedFoodInvalid) {
        this.addValidationError(
          reader.cellContext(rowNumber, columns.associatedFoodCode),
          'associatedFoodCodeNotFound',
          { foodCode },
        );
      }

      if (!foodRecord || !lang || !genericName || !promptText || associatedFoodInvalid)
        return;

      const associatedFoodKey = JSON.stringify([
        code,
        foodCode ?? null,
        categoryCode ?? null,
        multiple ?? null,
        linkAsMain,
      ]);
      let associatedFood = associatedFoodRecords.get(associatedFoodKey);

      if (!associatedFood) {
        associatedFood = {
          foodCode,
          categoryCode,
          multiple,
          linkAsMain,
          genericName: {},
          promptText: {},
          orderBy: String(foodRecord.associatedFoods.length + 1),
        };

        foodRecord.associatedFoods.push(associatedFood);
        associatedFoodRecords.set(associatedFoodKey, associatedFood);
      }

      associatedFood.genericName[lang] = genericName;
      associatedFood.promptText[lang] = promptText;
    });
  }

  private readAttributes(reader: XlsxWorksheetReader, itemsByCode: Map<string, FoodOrCategory>, codeColumnName: string): void {
    const codeColumn = reader.getColumnIndex(codeColumnName);
    const columns = attributeColumnIndices(reader);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const item = itemsByCode.get(reader.cellAsString(rowNumber, codeColumn));
      if (item)
        readAttributes(item.attributes, reader, rowNumber, columns);
    });
  }

  private readPortionSizeMethods(
    reader: XlsxWorksheetReader,
    itemsByCode: Map<string, FoodOrCategory>,
    _target: PortionTarget,
    codeColumnName: string,
  ): void {
    const hasDirectWeight = new Set<string>();
    const hasUnknown = new Set<string>();
    const columns = portionSizeColumnIndices(reader, codeColumnName);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber <= 2 || isRowEmpty(row))
        return;

      const code = reader.cellAsString(rowNumber, columns.code);
      const item = itemsByCode.get(code);

      if (!item)
        return;

      if (reader.cellAsBool(rowNumber, columns.enterWeightOption) && !hasDirectWeight.has(code)) {
        addPortionSizeMethod(item, {
          ...makeBasePsm('direct-weight', readDisplayOrder(reader, rowNumber, columns.enterWeightDisplayOrder, item)),
        });
        hasDirectWeight.add(code);
      }

      if (reader.cellAsBool(rowNumber, columns.dontKnowOption) && !hasUnknown.has(code)) {
        addPortionSizeMethod(item, {
          ...makeBasePsm('unknown', readDisplayOrder(reader, rowNumber, columns.dontKnowDisplayOrder, item)),
          weight: null,
        });
        hasUnknown.add(code);
      }

      this.readPortionSizeSections(reader, rowNumber, item, columns);
    });
  }

  private readPortionSizeSections(
    reader: XlsxWorksheetReader,
    rowNumber: number,
    item: FoodOrCategory,
    columns: PortionSizeColumns,
  ): void {
    const addIfPopulated = (sectionColumns: number[], parsePortionSizeMethod: () => PkgV2PortionSizeMethod | undefined) => {
      if (!sectionColumns.some(column => reader.cellAsOptionalString(rowNumber, column) !== undefined))
        return;

      const psm = parsePortionSizeMethod();

      if (psm)
        addPortionSizeMethod(item, psm);
    };

    const displayOrder = (column: number): number => readDisplayOrder(reader, rowNumber, column, item);
    const description = (column: number): string => reader.cellAsOptionalString(rowNumber, column) ?? '';

    addIfPopulated([
      columns.asServedServingImageSetId,
      columns.asServedLeftoversImageSetId,
      columns.asServedDescription,
      columns.asServedDisplayOrder,
      columns.asServedConversionFactor,
      columns.asServedShowLabels,
      columns.asServedMultipleOption,
      columns.asServedPathways,
    ], () => {
      const servingImageSet = reader.cellAsNonEmptyString(rowNumber, columns.asServedServingImageSetId);
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.asServedConversionFactor);

      if (!servingImageSet || conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('as-served', displayOrder(columns.asServedDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.asServedPathways))),
        description: description(columns.asServedDescription),
        servingImageSet,
        leftoversImageSet: reader.cellAsOptionalString(rowNumber, columns.asServedLeftoversImageSetId),
        labels: reader.cellAsBool(rowNumber, columns.asServedShowLabels),
        multiple: reader.cellAsBool(rowNumber, columns.asServedMultipleOption),
      };
    });

    addIfPopulated([
      columns.autoDescription,
      columns.autoDisplayOrder,
      columns.autoConversionFactor,
      columns.autoMode,
      columns.autoValue,
      columns.autoPathways,
    ], () => {
      const mode = reader.cellAsEnum(rowNumber, columns.autoMode, AUTO_MODES, 'weight, weight-per-100g-parent');
      const value = reader.cellAsNumber(rowNumber, columns.autoValue);
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.autoConversionFactor);

      if (!mode || value === undefined || conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('auto', displayOrder(columns.autoDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.autoPathways))),
        description: description(columns.autoDescription),
        mode,
        value,
      };
    });

    addIfPopulated([
      columns.guideImageId,
      columns.guideImageDescription,
      columns.guideImageDisplayOrder,
      columns.guideImageConversionFactor,
      columns.guideImageShowLabels,
      columns.guideImageVisibility,
    ], () => {
      const guideImageId = reader.cellAsNonEmptyString(rowNumber, columns.guideImageId);
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.guideImageConversionFactor);

      if (!guideImageId || conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('guide-image', displayOrder(columns.guideImageDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.guideImageVisibility))),
        description: description(columns.guideImageDescription),
        guideImageId,
        labels: reader.cellAsBool(rowNumber, columns.guideImageShowLabels),
      };
    });

    addIfPopulated([
      columns.drinkScaleDrinkwareSetId,
      columns.drinkScaleDescription,
      columns.drinkScaleDisplayOrder,
      columns.drinkScaleConversionFactor,
      columns.drinkScaleShowLabels,
      columns.drinkScaleMultipleOption,
      columns.drinkScaleInitialFillLevel,
      columns.drinkScaleSkipFillLevel,
      columns.drinkScalePathways,
    ], () => {
      const drinkwareId = reader.cellAsNonEmptyString(rowNumber, columns.drinkScaleDrinkwareSetId);
      const initialFillLevel = reader.cellAsNumber(rowNumber, columns.drinkScaleInitialFillLevel);
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.drinkScaleConversionFactor);

      if (!drinkwareId || initialFillLevel === undefined || conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('drink-scale', displayOrder(columns.drinkScaleDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.drinkScalePathways))),
        description: description(columns.drinkScaleDescription),
        drinkwareId,
        labels: reader.cellAsBool(rowNumber, columns.drinkScaleShowLabels),
        multiple: reader.cellAsBool(rowNumber, columns.drinkScaleMultipleOption),
        initialFillLevel,
        skipFillLevel: reader.cellAsBool(rowNumber, columns.drinkScaleSkipFillLevel) ?? false,
      };
    });

    addIfPopulated([
      columns.cerealType,
      columns.cerealDescription,
      columns.cerealDisplayOrder,
      columns.cerealConversionFactor,
      columns.cerealShowLabels,
      columns.cerealPathways,
    ], () => {
      const type = reader.cellAsEnum(rowNumber, columns.cerealType, CEREAL_TYPES, 'hoop, flake, rkris');
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.cerealConversionFactor);

      if (!type || conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('cereal', displayOrder(columns.cerealDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.cerealPathways))),
        description: description(columns.cerealDescription),
        type,
        labels: reader.cellAsBool(rowNumber, columns.cerealShowLabels),
      };
    });

    addIfPopulated([
      columns.milkOnCerealDescription,
      columns.milkOnCerealDisplayOrder,
      columns.milkOnCerealConversionFactor,
      columns.milkOnCerealShowLabels,
      columns.milkOnCerealPathways,
    ], () => {
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.milkOnCerealConversionFactor);

      if (conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('milk-on-cereal', displayOrder(columns.milkOnCerealDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.milkOnCerealPathways))),
        description: description(columns.milkOnCerealDescription),
        labels: reader.cellAsBool(rowNumber, columns.milkOnCerealShowLabels),
      };
    });

    addIfPopulated([
      columns.pizzaDescription,
      columns.pizzaDisplayOrder,
      columns.pizzaConversionFactor,
      columns.pizzaShowLabels,
      columns.pizzaPathways,
    ], () => {
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.pizzaConversionFactor);

      if (conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('pizza', displayOrder(columns.pizzaDisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.pizzaPathways))),
        description: description(columns.pizzaDescription),
        labels: reader.cellAsBool(rowNumber, columns.pizzaShowLabels),
      };
    });

    addIfPopulated([
      columns.pizzaV2Description,
      columns.pizzaV2DisplayOrder,
      columns.pizzaV2ConversionFactor,
      columns.pizzaV2ShowLabels,
      columns.pizzaV2Pathways,
    ], () => {
      const conversionFactor = reader.cellAsNumber(rowNumber, columns.pizzaV2ConversionFactor);

      if (conversionFactor === undefined)
        return undefined;

      return {
        ...makeBasePsm('pizza-v2', displayOrder(columns.pizzaV2DisplayOrder), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.pizzaV2Pathways))),
        description: description(columns.pizzaV2Description),
        labels: reader.cellAsBool(rowNumber, columns.pizzaV2ShowLabels),
      };
    });
  }

  private readStandardPortions(reader: XlsxWorksheetReader, itemsByCode: Map<string, FoodOrCategory>, codeColumnName: string): void {
    const drafts = new Map<string, StandardPortionDraft>();
    const columns = {
      code: reader.getColumnIndex(codeColumnName),
      portionSizeOption: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.portionSizeOption),
      description: reader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      displayOrder: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.displayOrder),
      conversionFactor: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.conversionFactor),
      standardUnitId: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.standardUnitId),
      unitWeight: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.unitWeight),
      omitFoodName: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.omitFoodName),
      inlineEstimateIn: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.inlineEstimateIn),
      inlineHowMany: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.inlineHowMany),
      pathways: reader.getColumnIndex(XLSX_COLUMN_NAMES.standardUnits.pathways),
    };

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = reader.cellAsString(rowNumber, columns.code);
      const option = reader.cellAsString(rowNumber, columns.portionSizeOption);
      const item = itemsByCode.get(code);

      if (!item || !option)
        return;

      const conversionFactor = reader.cellAsNumber(rowNumber, columns.conversionFactor);
      const weight = reader.cellAsNumber(rowNumber, columns.unitWeight);

      if (conversionFactor === undefined || weight === undefined)
        return;

      const key = `${code}:${option}`;
      const existing = drafts.get(key);
      const draft = existing ?? {
        ...makeBasePsm('standard-portion', readDisplayOrder(reader, rowNumber, columns.displayOrder, item), conversionFactor, splitPathways(reader.cellAsOptionalString(rowNumber, columns.pathways))),
        description: reader.cellAsString(rowNumber, columns.description),
        units: [] as StandardPortionDraft['units'],
      };

      draft.units.push({
        name: reader.cellAsString(rowNumber, columns.standardUnitId),
        weight,
        omitFoodDescription: reader.cellAsBool(rowNumber, columns.omitFoodName) ?? false,
        inlineEstimateIn: reader.cellAsOptionalString(rowNumber, columns.inlineEstimateIn),
        inlineHowMany: reader.cellAsOptionalString(rowNumber, columns.inlineHowMany),
      });

      if (!existing) {
        drafts.set(key, draft);
        addPortionSizeMethod(item, draft);
      }
    });
  }

  private readParentPortions(reader: XlsxWorksheetReader, itemsByCode: Map<string, FoodOrCategory>, codeColumnName: string): void {
    const drafts = new Map<string, MilkInHotDrinkDraft | ParentFoodPortionDraft>();
    const columns = {
      code: reader.getColumnIndex(codeColumnName),
      portionSizeOption: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.portionSizeOption),
      methodType: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.methodType),
      description: reader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      displayOrder: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.displayOrder),
      conversionFactor: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.conversionFactor),
      category: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.category),
      parentPortion: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.parentPortion),
      language: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.language),
      label: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.label),
      shortLabel: reader.getColumnIndex(XLSX_COLUMN_NAMES.parentFoodPortion.shortLabel),
    };

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const code = reader.cellAsString(rowNumber, columns.code);
      const option = reader.cellAsString(rowNumber, columns.portionSizeOption);
      const method = reader.cellAsString(rowNumber, columns.methodType);
      const item = itemsByCode.get(code);
      const label = reader.cellAsString(rowNumber, columns.label);

      if (!item || !option || !label)
        return;

      const value = reader.cellAsNumber(rowNumber, columns.parentPortion);

      if (value === undefined)
        return;

      const key = `${code}:${option}:${method}`;
      let draft = drafts.get(key);

      if (!draft) {
        if (method !== 'milk-in-a-hot-drink' && method !== 'parent-food-portion')
          return;

        const conversionFactor = reader.cellAsNumber(rowNumber, columns.conversionFactor);

        if (conversionFactor === undefined)
          return;

        const order = readDisplayOrder(reader, rowNumber, columns.displayOrder, item);

        if (method === 'milk-in-a-hot-drink') {
          draft = {
            ...makeBasePsm('milk-in-a-hot-drink', order, conversionFactor),
            description: reader.cellAsString(rowNumber, columns.description),
            options: { en: [] as MilkInHotDrinkDraft['options']['en'] },
          };
        }
        else {
          draft = {
            ...makeBasePsm('parent-food-portion', order, conversionFactor),
            description: reader.cellAsString(rowNumber, columns.description),
            options: { _default: { en: [] as ParentFoodPortionDraft['options']['_default']['en'] } },
          };
        }

        drafts.set(key, draft);
        addPortionSizeMethod(item, draft);
      }

      const language = reader.cellAsString(rowNumber, columns.language) || 'en';
      const optionValue = {
        value,
        label,
        shortLabel: reader.cellAsOptionalString(rowNumber, columns.shortLabel),
      };

      if (draft.method === 'milk-in-a-hot-drink') {
        (draft.options[language] ??= []).push(optionValue);
      }
      else {
        const category = reader.cellAsOptionalString(rowNumber, columns.category) ?? '_default';
        const categoryOptions = draft.options[category] ??= { en: [] };
        (categoryOptions[language] ??= []).push(optionValue);
      }
    });
  }

  private async readSynonymSets(sourcePath: string): Promise<Record<string, PkgV2SynonymSet[]>> {
    const fileName = XLSX_FILE_NAMES.synonymSets;
    const workbookReader = await XlsxWorkbookReader.fromFile(sourcePath, fileName, this.addValidationError.bind(this));
    const synonymSets: Record<string, PkgV2SynonymSet[]> = {};
    const reader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.synonymSets, [
      requiredHeader(XLSX_COLUMN_NAMES.synonymSets.locale),
      requiredHeader(XLSX_COLUMN_NAMES.synonymSets.synonyms),
    ]);

    if (!reader)
      return synonymSets;

    const columns = reader.getColumnIndices(XLSX_COLUMN_NAMES.synonymSets);

    reader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const locale = reader.cellAsNonEmptyString(rowNumber, columns.locale);
      const synonymsText = reader.cellAsNonEmptyString(rowNumber, columns.synonyms);

      if (!locale || !synonymsText)
        return;

      const synonyms = synonymsText.split(WHITESPACE_REGEX).filter(Boolean);

      if (!locale || !synonyms.length)
        return;

      synonymSets[locale] = [...(synonymSets[locale] ?? []), synonyms] as PkgV2SynonymSet[];
    });

    return synonymSets;
  }

  private async readPortionReferenceData(sourcePath: string): Promise<{
    asServedSets: PkgV2AsServedSet[];
    imageMaps: PkgV2ImageMap[];
    guideImages: PkgV2GuideImage[];
    drinkwareSets: PkgV2DrinkwareSet[];
  }> {
    const workbookReader = await XlsxWorkbookReader.fromFile(sourcePath, XLSX_FILE_NAMES.portionSize, this.addValidationError.bind(this));
    const asServedSetsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.asServedSets, [
      requiredHeader(XLSX_COLUMN_NAMES.common.id),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.selectionImagePath),
      requiredHeader(XLSX_COLUMN_NAMES.common.labelJson),
    ]);
    const asServedImagesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.asServedImages, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.setId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.imagePath),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.weight),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.keywords),
      requiredHeader(XLSX_COLUMN_NAMES.common.labelJson),
    ]);
    const imageMapsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.imageMaps, [
      requiredHeader(XLSX_COLUMN_NAMES.common.id),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath),
    ]);
    const imageMapObjectsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.imageMapObjects, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.imageMapId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.navigationIndex),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates),
    ]);
    const guideImagesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.guideImages, [
      requiredHeader(XLSX_COLUMN_NAMES.common.id),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.imageMapId),
      requiredHeader(XLSX_COLUMN_NAMES.common.labelJson),
    ]);
    const guideImageObjectsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.guideImageObjects, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.guideImageId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.weight),
    ]);
    const drinkwareSetsReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.drinkwareSets, [
      requiredHeader(XLSX_COLUMN_NAMES.common.id),
      requiredHeader(XLSX_COLUMN_NAMES.common.description),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.selectionImageMapId),
      requiredHeader(XLSX_COLUMN_NAMES.common.labelJson),
    ]);
    const drinkwareScalesReader = workbookReader.getWorksheetReader(XLSX_SHEET_NAMES.drinkwareScales, [
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.setId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.choiceId),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.version),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath),
      requiredHeader(XLSX_COLUMN_NAMES.common.labelJson),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.width),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.height),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.emptyLevel),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.fullLevel),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.overlayImagePath),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.volumeMethod),
      requiredHeader(XLSX_COLUMN_NAMES.portionSizeReference.volumeSamples),
    ]);

    return {
      asServedSets: asServedSetsReader && asServedImagesReader
        ? this.readAsServedSets(asServedSetsReader, asServedImagesReader)
        : [],
      imageMaps: imageMapsReader && imageMapObjectsReader
        ? this.readImageMaps(imageMapsReader, imageMapObjectsReader)
        : [],
      guideImages: guideImagesReader && guideImageObjectsReader
        ? this.readGuideImages(guideImagesReader, guideImageObjectsReader)
        : [],
      drinkwareSets: drinkwareSetsReader && drinkwareScalesReader
        ? this.readDrinkwareSets(drinkwareSetsReader, drinkwareScalesReader)
        : [],
    };
  }

  private readAsServedSets(
    setsReader: XlsxWorksheetReader,
    imagesReader: XlsxWorksheetReader,
  ): PkgV2AsServedSet[] {
    const sets: PkgV2AsServedSet[] = [];
    const setsById = new Map<string, PkgV2AsServedSet>();
    const setColumns = {
      id: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.id),
      description: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      selectionImagePath: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.selectionImagePath),
      labelJson: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.labelJson),
    };
    const imageColumns = {
      setId: imagesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.setId),
      imagePath: imagesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.imagePath),
      weight: imagesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.weight),
      keywords: imagesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.keywords),
      labelJson: imagesReader.getColumnIndex(XLSX_COLUMN_NAMES.common.labelJson),
    };

    setsReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = setsReader.cellAsString(rowNumber, setColumns.id);
      if (!id)
        return;

      const label = setsReader.cellAsJson(rowNumber, setColumns.labelJson, null);
      if (label === undefined)
        return;

      const set: PkgV2AsServedSet = {
        id,
        description: setsReader.cellAsString(rowNumber, setColumns.description),
        selectionImagePath: setsReader.cellAsString(rowNumber, setColumns.selectionImagePath),
        label,
        images: [],
      };

      sets.push(set);
      setsById.set(id, set);
    });

    imagesReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const set = setsById.get(imagesReader.cellAsString(rowNumber, imageColumns.setId));
      if (!set)
        return;

      const weight = imagesReader.cellAsNumber(rowNumber, imageColumns.weight);
      const label = imagesReader.cellAsJson(rowNumber, imageColumns.labelJson, null);

      if (weight === undefined || label === undefined)
        return;

      set.images.push({
        imagePath: imagesReader.cellAsString(rowNumber, imageColumns.imagePath),
        weight,
        imageKeywords: splitList(imagesReader.cellAsOptionalString(rowNumber, imageColumns.keywords)),
        label,
      });
    });

    return sets;
  }

  private readImageMaps(
    mapsReader: XlsxWorksheetReader,
    objectsReader: XlsxWorksheetReader,
  ): PkgV2ImageMap[] {
    const imageMaps: PkgV2ImageMap[] = [];
    const imageMapsById = new Map<string, PkgV2ImageMap>();
    const mapColumns = {
      id: mapsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.id),
      description: mapsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      baseImagePath: mapsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath),
    };
    const objectColumns = {
      imageMapId: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.imageMapId),
      imageMapObjectId: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId),
      description: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      navigationIndex: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.navigationIndex),
      outlineCoordinates: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates),
    };

    mapsReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = mapsReader.cellAsString(rowNumber, mapColumns.id);
      if (!id)
        return;

      const imageMap: PkgV2ImageMap = {
        id,
        description: mapsReader.cellAsString(rowNumber, mapColumns.description),
        baseImagePath: mapsReader.cellAsString(rowNumber, mapColumns.baseImagePath),
        objects: {},
      };

      imageMaps.push(imageMap);
      imageMapsById.set(id, imageMap);
    });

    objectsReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const imageMap = imageMapsById.get(objectsReader.cellAsString(rowNumber, objectColumns.imageMapId));
      if (!imageMap)
        return;

      const objectId = objectsReader.cellAsNumber(rowNumber, objectColumns.imageMapObjectId);
      const navigationIndex = objectsReader.cellAsNumber(rowNumber, objectColumns.navigationIndex);
      const outlineCoordinates = objectsReader.cellAsJson<number[]>(rowNumber, objectColumns.outlineCoordinates, []);

      if (objectId === undefined || navigationIndex === undefined || outlineCoordinates === undefined)
        return;

      imageMap.objects[objectId] = {
        description: objectsReader.cellAsString(rowNumber, objectColumns.description),
        navigationIndex,
        outlineCoordinates,
      };
    });

    return imageMaps;
  }

  private readGuideImages(
    guideImagesReader: XlsxWorksheetReader,
    objectsReader: XlsxWorksheetReader,
  ): PkgV2GuideImage[] {
    const guideImages: PkgV2GuideImage[] = [];
    const guideImagesById = new Map<string, PkgV2GuideImage>();
    const guideImageColumns = {
      id: guideImagesReader.getColumnIndex(XLSX_COLUMN_NAMES.common.id),
      description: guideImagesReader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      imageMapId: guideImagesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.imageMapId),
      labelJson: guideImagesReader.getColumnIndex(XLSX_COLUMN_NAMES.common.labelJson),
    };
    const objectColumns = {
      guideImageId: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.guideImageId),
      imageMapObjectId: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId),
      weight: objectsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.weight),
    };

    guideImagesReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = guideImagesReader.cellAsString(rowNumber, guideImageColumns.id);
      if (!id)
        return;

      const label = guideImagesReader.cellAsJson<PkgV2GuideImage['label']>(rowNumber, guideImageColumns.labelJson, {});
      if (label === undefined)
        return;

      const guideImage: PkgV2GuideImage = {
        id,
        description: guideImagesReader.cellAsString(rowNumber, guideImageColumns.description),
        imageMapId: guideImagesReader.cellAsString(rowNumber, guideImageColumns.imageMapId),
        label,
        objectWeights: {},
      };

      guideImages.push(guideImage);
      guideImagesById.set(id, guideImage);
    });

    objectsReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const guideImage = guideImagesById.get(objectsReader.cellAsString(rowNumber, objectColumns.guideImageId));
      if (!guideImage)
        return;

      const objectId = objectsReader.cellAsNumber(rowNumber, objectColumns.imageMapObjectId);
      const weight = objectsReader.cellAsNumber(rowNumber, objectColumns.weight);

      if (objectId === undefined || weight === undefined)
        return;

      guideImage.objectWeights[objectId] = weight;
    });

    return guideImages;
  }

  private readDrinkwareSets(
    setsReader: XlsxWorksheetReader,
    scalesReader: XlsxWorksheetReader,
  ): PkgV2DrinkwareSet[] {
    const drinkwareSets: PkgV2DrinkwareSet[] = [];
    const drinkwareSetsById = new Map<string, PkgV2DrinkwareSet>();
    const setColumns = {
      id: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.id),
      description: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.description),
      selectionImageMapId: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.selectionImageMapId),
      labelJson: setsReader.getColumnIndex(XLSX_COLUMN_NAMES.common.labelJson),
    };
    const scaleColumns = {
      setId: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.setId),
      choiceId: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.choiceId),
      version: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.version),
      baseImagePath: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath),
      labelJson: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.common.labelJson),
      width: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.width),
      height: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.height),
      emptyLevel: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.emptyLevel),
      fullLevel: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.fullLevel),
      overlayImagePath: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.overlayImagePath),
      outlineCoordinates: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates),
      volumeMethod: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.volumeMethod),
      volumeSamples: scalesReader.getColumnIndex(XLSX_COLUMN_NAMES.portionSizeReference.volumeSamples),
    };

    setsReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const id = setsReader.cellAsString(rowNumber, setColumns.id);
      if (!id)
        return;

      const label = setsReader.cellAsJson<PkgV2DrinkwareSet['label']>(rowNumber, setColumns.labelJson, {});
      if (label === undefined)
        return;

      const drinkwareSet: PkgV2DrinkwareSet = {
        id,
        description: setsReader.cellAsString(rowNumber, setColumns.description),
        selectionImageMapId: setsReader.cellAsString(rowNumber, setColumns.selectionImageMapId),
        label,
        scales: {},
      };

      drinkwareSets.push(drinkwareSet);
      drinkwareSetsById.set(id, drinkwareSet);
    });

    scalesReader.forEachRow((row, rowNumber) => {
      if (rowNumber === 1 || isRowEmpty(row))
        return;

      const drinkwareSet = drinkwareSetsById.get(scalesReader.cellAsString(rowNumber, scaleColumns.setId));
      if (!drinkwareSet)
        return;

      const choiceId = scalesReader.cellAsNumber(rowNumber, scaleColumns.choiceId);
      const version = scalesReader.cellAsNumber(rowNumber, scaleColumns.version);

      if (choiceId === undefined || version === undefined)
        return;

      if (version === 1) {
        const width = scalesReader.cellAsNumber(rowNumber, scaleColumns.width);
        const height = scalesReader.cellAsNumber(rowNumber, scaleColumns.height);
        const emptyLevel = scalesReader.cellAsNumber(rowNumber, scaleColumns.emptyLevel);
        const fullLevel = scalesReader.cellAsNumber(rowNumber, scaleColumns.fullLevel);
        const labelJson = scalesReader.cellAsJson(rowNumber, scaleColumns.labelJson, { label: '' });
        const volumeSamples = scalesReader.cellAsJson<number[]>(rowNumber, scaleColumns.volumeSamples, []);

        if (width === undefined || height === undefined || emptyLevel === undefined || fullLevel === undefined || labelJson === undefined || volumeSamples === undefined)
          return;

        drinkwareSet.scales[choiceId] = {
          version: 1,
          baseImagePath: scalesReader.cellAsString(rowNumber, scaleColumns.baseImagePath),
          label: labelJson.label ?? '',
          width,
          height,
          emptyLevel,
          fullLevel,
          overlayImagePath: scalesReader.cellAsString(rowNumber, scaleColumns.overlayImagePath),
          volumeSamples,
        };
      }
      else {
        const label = scalesReader.cellAsJson<PkgV2DrinkScaleV2['label']>(rowNumber, scaleColumns.labelJson, {});
        const outlineCoordinates = scalesReader.cellAsJson<number[]>(rowNumber, scaleColumns.outlineCoordinates, []);
        const volumeMethod = scalesReader.cellAsEnum(rowNumber, scaleColumns.volumeMethod, VOLUME_METHODS, 'lookUpTable, cylindrical');
        const volumeSamples = scalesReader.cellAsJson<number[]>(rowNumber, scaleColumns.volumeSamples, []);

        if (label === undefined || outlineCoordinates === undefined || volumeMethod === undefined || volumeSamples === undefined)
          return;

        drinkwareSet.scales[choiceId] = {
          version: 2,
          baseImagePath: scalesReader.cellAsString(rowNumber, scaleColumns.baseImagePath),
          label,
          outlineCoordinates,
          volumeMethod,
          volumeSamples,
        };
      }
    });

    return drinkwareSets;
  }
}
