import type { PackageWriter, PackageWriterFactory } from '../types';
import type { PackageExportOptions } from '@intake24/common/types/http/admin';
import type { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
import type { PkgV2Food, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';
import type { PkgV2GuideImage } from '@intake24/common/types/package/guide-image';
import type { PkgV2ImageMap } from '@intake24/common/types/package/image-map';
import type { PkgV2Locale } from '@intake24/common/types/package/locale';
import type { PkgV2SynonymSet } from '@intake24/common/types/package/synonym-sets';

import path from 'node:path';

import ExcelJS from 'exceljs';

import { XLSX_COLUMN_NAMES, XLSX_FILE_NAMES, XLSX_SHEET_NAMES, xlsxBoolean } from '../../xlsx-format-constants';
import { PortionSizeWriter } from './portion-size-sheet';

const FOOD_ACTIONS = ['Retain', 'Delete', 'Amend', 'Add'] as const;
const FOOD_ACTION_VALIDATION: ExcelJS.DataValidation = {
  type: 'list',
  formulae: [`"${FOOD_ACTIONS.join(',')}"`],
  showErrorMessage: true,
  errorStyle: 'error',
  errorTitle: 'Invalid action',
  error: `Choose one of: ${FOOD_ACTIONS.join(', ')}`,
};
const FOOD_ACTION_VALIDATION_RANGE = 'B2:B1048576';
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]+/g;

type WorksheetWithDataValidations = ExcelJS.Worksheet & {
  dataValidations?: {
    add: (range: string, validation: ExcelJS.DataValidation) => void;
  };
};

interface FoodsWorkbook {
  workbook: ExcelJS.stream.xlsx.WorkbookWriter;
  foodsSheet: ExcelJS.Worksheet;
  altNamesSheet: ExcelJS.Worksheet;
  nutrientSheet: ExcelJS.Worksheet;
  attributesSheet: ExcelJS.Worksheet;
  tagsSheet: ExcelJS.Worksheet;
  brandsSheet: ExcelJS.Worksheet;
  associatedFoodsSheet: ExcelJS.Worksheet;
  portionSizesSheet: ExcelJS.Worksheet;
  portionSizeWriter: PortionSizeWriter;
  standardUnitsSheet: ExcelJS.Worksheet;
  parentPortionSheet: ExcelJS.Worksheet;
}

interface CategoriesWorkbook {
  workbook: ExcelJS.stream.xlsx.WorkbookWriter;
  categoriesSheet: ExcelJS.Worksheet;
  hierarchySheet: ExcelJS.Worksheet;
  attributesSheet: ExcelJS.Worksheet;
  portionSizesSheet: ExcelJS.Worksheet;
  portionSizeWriter: PortionSizeWriter;
  standardUnitsSheet: ExcelJS.Worksheet;
  parentPortionSheet: ExcelJS.Worksheet;
  nextCategoryMasterRow: number;
  hierarchyCategories: BufferedCategoryRecord[];
}

type BufferedCategoryRecord = Pick<PkgV2Category, 'code' | 'name' | 'englishName' | 'hidden' | 'parentCategories'> & {
  masterRowNumber: number;
};

type CategoryHierarchyRow = {
  category: BufferedCategoryRecord;
  depth: number;
};

export class PackageXlsxWriter implements PackageWriter {
  private outputPath: string;
  private exportOptions: PackageExportOptions;
  private foodWorkbooks: Map<string, FoodsWorkbook> = new Map();
  private categoryWorkbooks: Map<string, CategoriesWorkbook> = new Map();
  private foodWorkbookPaths: Map<string, string> = new Map();
  private categoryWorkbookPaths: Map<string, string> = new Map();
  private usedWorkbookPaths: Set<string> = new Set();
  private portionWorkbook?: ExcelJS.stream.xlsx.WorkbookWriter;
  private localesWorkbook?: ExcelJS.stream.xlsx.WorkbookWriter;
  private synonymSetsWorkbook?: ExcelJS.stream.xlsx.WorkbookWriter;

  constructor(outputPath: string, exportOptions: PackageExportOptions) {
    this.outputPath = outputPath;
    this.exportOptions = exportOptions;
  }

  private encodeUseInRecipes(useInRecipes: number | undefined): string {
    switch (useInRecipes) {
      case 0:
        return 'any_context';
      case 1:
        return 'regular_food';
      case 2:
        return 'recipe_ingredient';
      default:
        return '';
    }
  }

  private getCategoryDisplayName(category: Pick<BufferedCategoryRecord, 'name' | 'englishName' | 'code'>): string {
    return category.name || category.englishName || category.code;
  }

  private includeFoodActionColumn(): boolean {
    return this.exportOptions.options.xlsx?.includeActionColumn === true;
  }

  private safeFilenameSegment(value: string): string {
    const segment = value
      .trim()
      .replace(UNSAFE_FILENAME_CHARS, '_')
      .replace(/\s+/g, '_')
      .replace(/^\.+/, '')
      .replace(/[. ]+$/, '');

    return segment || 'locale';
  }

  private getWorkbookPath(prefix: 'foods' | 'categories', localeId: string, workbookPaths: Map<string, string>): string {
    const existingPath = workbookPaths.get(localeId);
    if (existingPath)
      return existingPath;

    const safeLocaleId = this.safeFilenameSegment(localeId);
    let workbookPath = `${prefix}_${safeLocaleId}.xlsx`;
    let suffix = 2;

    while (this.usedWorkbookPaths.has(workbookPath)) {
      workbookPath = `${prefix}_${safeLocaleId}_${suffix}.xlsx`;
      suffix++;
    }

    workbookPaths.set(localeId, workbookPath);
    this.usedWorkbookPaths.add(workbookPath);

    return workbookPath;
  }

  private addDataValidation(sheet: ExcelJS.Worksheet, range: string, validation: ExcelJS.DataValidation) {
    (sheet as WorksheetWithDataValidations).dataValidations?.add(range, validation);
  }

  private createAttributesSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const attributesSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.attributes);
    attributesSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: XLSX_COLUMN_NAMES.attributes.readyMealOption, width: 20 },
      { header: XLSX_COLUMN_NAMES.attributes.reasonableAmount, width: 20 },
      { header: XLSX_COLUMN_NAMES.attributes.sameAsBeforeOption, width: 25 },
      { header: XLSX_COLUMN_NAMES.attributes.useInRecipes, width: 15 },
    ];
    const attributesHeaderRow = attributesSheet.getRow(1);
    attributesHeaderRow.font = { bold: true };
    attributesHeaderRow.border = { bottom: { style: 'thin' } };
    return attributesSheet;
  }

  private createPortionSizesSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string, nameHeader: string, nameReference: string): { portionSizesSheet: ExcelJS.Worksheet; portionSizeWriter: PortionSizeWriter } {
    const portionSizesSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.portionSize);
    const portionSizeWriter = new PortionSizeWriter(portionSizesSheet, codeHeader, nameHeader, nameReference);
    return { portionSizesSheet, portionSizeWriter };
  }

  private createStandardUnitsSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const standardUnitsSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.standardUnits);
    standardUnitsSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: XLSX_COLUMN_NAMES.standardUnits.portionSizeOption, width: 20 },
      { header: XLSX_COLUMN_NAMES.common.description, width: 26 },
      { header: XLSX_COLUMN_NAMES.standardUnits.displayOrder, width: 14 },
      { header: XLSX_COLUMN_NAMES.standardUnits.conversionFactor, width: 18 },
      { header: XLSX_COLUMN_NAMES.standardUnits.standardUnitId, width: 26 },
      { header: XLSX_COLUMN_NAMES.standardUnits.unitWeight, width: 12 },
      { header: XLSX_COLUMN_NAMES.standardUnits.omitFoodName, width: 16 },
      { header: XLSX_COLUMN_NAMES.standardUnits.inlineEstimateIn, width: 80 },
      { header: XLSX_COLUMN_NAMES.standardUnits.inlineHowMany, width: 80 },
      { header: XLSX_COLUMN_NAMES.standardUnits.pathways, width: 20 },
    ];
    standardUnitsSheet.getRow(1).font = { bold: true };
    standardUnitsSheet.getRow(1).border = { bottom: { style: 'thin' } };
    return standardUnitsSheet;
  }

  private createParentPortionSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const parentPortionSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.parentFoodPortion);
    parentPortionSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.portionSizeOption, width: 20 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.methodType, width: 20 },
      { header: XLSX_COLUMN_NAMES.common.description, width: 26 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.displayOrder, width: 14 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.conversionFactor, width: 18 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.category, width: 20 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.parentPortion, width: 60 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.language, width: 18 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.label, width: 60 },
      { header: XLSX_COLUMN_NAMES.parentFoodPortion.shortLabel, width: 60 },
    ];
    parentPortionSheet.getRow(1).font = { bold: true };
    parentPortionSheet.getRow(1).border = { bottom: { style: 'thin' } };
    return parentPortionSheet;
  }

  private compareBufferedCategories(left: BufferedCategoryRecord, right: BufferedCategoryRecord): number {
    return this.getCategoryDisplayName(left).localeCompare(this.getCategoryDisplayName(right)) || left.code.localeCompare(right.code);
  }

  private createCategoryHierarchySheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter): ExcelJS.Worksheet {
    const hierarchySheet = workbook.addWorksheet(XLSX_SHEET_NAMES.categoryStructure, {
      properties: {
        outlineLevelRow: 7,
      },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    return hierarchySheet;
  }

  private buildCategoryHierarchyRows(categories: BufferedCategoryRecord[]): CategoryHierarchyRow[] {
    const categoriesByCode = new Map(categories.map(category => [category.code, category]));
    const childCodesByParent = new Map<string, string[]>();
    const roots: BufferedCategoryRecord[] = [];

    for (const category of categories) {
      const knownParents = category.parentCategories.filter(parentCode => categoriesByCode.has(parentCode));

      if (!knownParents.length || knownParents.every(parentCode => categoriesByCode.get(parentCode)?.hidden)) {
        roots.push(category);
      }

      for (const parentCode of knownParents) {
        const childCodes = childCodesByParent.get(parentCode) ?? [];
        childCodes.push(category.code);
        childCodesByParent.set(parentCode, childCodes);
      }
    }

    const getSortedChildren = (parentCode: string): BufferedCategoryRecord[] => {
      const childCodes = childCodesByParent.get(parentCode);
      if (!childCodes)
        return [];

      return childCodes
        .map(code => categoriesByCode.get(code))
        .filter((category): category is BufferedCategoryRecord => category !== undefined)
        .sort((left, right) => this.compareBufferedCategories(left, right));
    };

    const rows: CategoryHierarchyRow[] = [];

    const visitCategory = (
      category: BufferedCategoryRecord,
      depth: number,
      pathCodes: string[],
    ) => {
      rows.push({
        category,
        depth,
      });

      const children = getSortedChildren(category.code);

      children.forEach((child) => {
        if (pathCodes.includes(child.code))
          return;

        visitCategory(
          child,
          depth + 1,
          [...pathCodes, child.code],
        );
      });
    };

    const sortedRoots = roots.sort((left, right) => this.compareBufferedCategories(left, right));

    sortedRoots.forEach((root) => {
      visitCategory(root, 0, [root.code]);
    });

    return rows;
  }

  private writeCategoryHierarchySheet(workbook: CategoriesWorkbook) {
    const hierarchyRows = this.buildCategoryHierarchyRows(workbook.hierarchyCategories);

    workbook.hierarchySheet.columns = [
      { header: XLSX_COLUMN_NAMES.categoryStructure.localName, width: 60 },
      { header: XLSX_COLUMN_NAMES.categoryStructure.code, width: 16 },
      { header: XLSX_COLUMN_NAMES.categoryStructure.hidden, width: 10 },
      { header: XLSX_COLUMN_NAMES.categoryStructure.englishName, width: 50 },
    ];

    const headerRow = workbook.hierarchySheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.border = { bottom: { style: 'thin' } };
    workbook.hierarchySheet.autoFilter = 'A1:D1';

    for (const hierarchyRow of hierarchyRows) {
      const localName = `${'\u00A0\u00A0\u00A0\u00A0'.repeat(hierarchyRow.depth)}${this.getCategoryDisplayName(hierarchyRow.category)}`;
      const row = workbook.hierarchySheet.addRow([
        localName,
        hierarchyRow.category.code,
        xlsxBoolean(hierarchyRow.category.hidden),
        hierarchyRow.category.englishName,
      ]);

      row.outlineLevel = Math.min(hierarchyRow.depth, 7);

      if (hierarchyRow.depth === 0) {
        row.font = { bold: true };
      }
      if (hierarchyRow.category.hidden) {
        row.font = {
          ...(row.font ?? {}),
          color: { argb: 'FF808080' },
        };
      }

      row.getCell(2).value = {
        text: hierarchyRow.category.code,
        hyperlink: `#'${XLSX_SHEET_NAMES.categoriesMasterList}'!A${hierarchyRow.category.masterRowNumber}`,
        tooltip: `Go to ${XLSX_SHEET_NAMES.categoriesMasterList} row ${hierarchyRow.category.masterRowNumber}`,
      };
      row.getCell(2).font = {
        ...(row.font ?? {}),
        color: { argb: 'FF0563C1' },
        underline: true,
      };

      row.getCell(3).alignment = { horizontal: 'center' };

      row.commit();
    }
  }

  private getOrCreateFoodsWorkbook(localeId: string): FoodsWorkbook {
    const existingWb = this.foodWorkbooks.get(localeId);
    if (existingWb !== undefined)
      return existingWb;

    const filename = path.join(this.outputPath, this.getWorkbookPath('foods', localeId, this.foodWorkbookPaths));
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

    const foodsSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.foodsMasterList);
    const foodsColumns: Partial<ExcelJS.Column>[] = [
      { header: XLSX_COLUMN_NAMES.foodsMasterList.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.foodsMasterList.name, width: 120 },
      { header: XLSX_COLUMN_NAMES.foodsMasterList.englishName, width: 120 },
      { header: XLSX_COLUMN_NAMES.foodsMasterList.parentCategories, width: 80 },
      { header: XLSX_COLUMN_NAMES.foodsMasterList.thumbnailPath, width: 80 },
    ];

    if (this.includeFoodActionColumn()) {
      foodsColumns.splice(1, 0, { header: XLSX_COLUMN_NAMES.foodsMasterList.action, width: 14 });
    }

    foodsSheet.columns = foodsColumns;

    if (this.includeFoodActionColumn()) {
      this.addDataValidation(foodsSheet, FOOD_ACTION_VALIDATION_RANGE, FOOD_ACTION_VALIDATION);
    }

    const foodsHeaderRow = foodsSheet.getRow(1);
    foodsHeaderRow.font = { bold: true };
    foodsHeaderRow.border = { bottom: { style: 'thin' } };

    const altNamesSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.altNames);
    altNamesSheet.columns = [
      { header: XLSX_COLUMN_NAMES.altNames.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.altNames.language, width: 10 },
      { header: XLSX_COLUMN_NAMES.altNames.alternativeName, width: 40 },
    ];
    const altNamesHeaderRow = altNamesSheet.getRow(1);
    altNamesHeaderRow.font = { bold: true };
    altNamesHeaderRow.border = { bottom: { style: 'thin' } };

    const nutrientSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.nutrientMapping);
    nutrientSheet.columns = [
      { header: XLSX_COLUMN_NAMES.nutrientMapping.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.nutrientMapping.nutrientTableId, width: 30 },
      { header: XLSX_COLUMN_NAMES.nutrientMapping.nutrientRecordId, width: 30 },
    ];
    const nutrientHeaderRow = nutrientSheet.getRow(1);
    nutrientHeaderRow.font = { bold: true };
    nutrientHeaderRow.border = { bottom: { style: 'thin' } };

    const tagsSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.tags);
    const tagsColumns: Partial<ExcelJS.Column>[] = [
      { header: XLSX_COLUMN_NAMES.tags.code, width: 12 },
    ];
    for (let i = 1; i <= 12; i++) {
      tagsColumns.push({ header: XLSX_COLUMN_NAMES.tags.tag(i), width: 30 });
    }
    tagsSheet.columns = tagsColumns;
    const tagsHeaderRow = tagsSheet.getRow(1);
    tagsHeaderRow.font = { bold: true };
    tagsHeaderRow.border = { bottom: { style: 'thin' } };

    const brandsSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.brands);
    brandsSheet.columns = [
      { header: XLSX_COLUMN_NAMES.brands.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.brands.brandName, width: 30 },
    ];
    const brandsHeaderRow = brandsSheet.getRow(1);
    brandsHeaderRow.font = { bold: true };
    brandsHeaderRow.border = { bottom: { style: 'thin' } };

    const associatedFoodsSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.associatedFoods);
    associatedFoodsSheet.columns = [
      { header: XLSX_COLUMN_NAMES.associatedFoods.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.associatedFoodCode, width: 20 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.associatedCategoryCode, width: 25 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.multiple, width: 10 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.linkAsMain, width: 15 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.language, width: 10 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.genericName, width: 30 },
      { header: XLSX_COLUMN_NAMES.associatedFoods.promptText, width: 60 },
    ];
    const associatedFoodsHeaderRow = associatedFoodsSheet.getRow(1);
    associatedFoodsHeaderRow.font = { bold: true };
    associatedFoodsHeaderRow.border = { bottom: { style: 'thin' } };

    const attributesSheet = this.createAttributesSheet(workbook, XLSX_COLUMN_NAMES.portionSize.foodCode);
    const { portionSizesSheet, portionSizeWriter } = this.createPortionSizesSheet(workbook, XLSX_COLUMN_NAMES.portionSize.foodCode, XLSX_COLUMN_NAMES.portionSize.foodName, `'${XLSX_SHEET_NAMES.foodsMasterList}'`);
    const standardUnitsSheet = this.createStandardUnitsSheet(workbook, XLSX_COLUMN_NAMES.portionSize.foodCode);
    const parentPortionSheet = this.createParentPortionSheet(workbook, XLSX_COLUMN_NAMES.portionSize.foodCode);

    const foodsWorkbook: FoodsWorkbook = {
      workbook,
      foodsSheet,
      altNamesSheet,
      tagsSheet,
      associatedFoodsSheet,
      attributesSheet,
      brandsSheet,
      nutrientSheet,
      portionSizesSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
    };

    this.foodWorkbooks.set(localeId, foodsWorkbook);

    return foodsWorkbook;
  }

  private getOrCreateCategoriesWorkbook(localeId: string): CategoriesWorkbook {
    const existingWb = this.categoryWorkbooks.get(localeId);
    if (existingWb !== undefined)
      return existingWb;

    const filename = path.join(this.outputPath, this.getWorkbookPath('categories', localeId, this.categoryWorkbookPaths));
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

    const categoriesSheet = workbook.addWorksheet(XLSX_SHEET_NAMES.categoriesMasterList);
    categoriesSheet.columns = [
      { header: XLSX_COLUMN_NAMES.categoriesMasterList.code, width: 12 },
      { header: XLSX_COLUMN_NAMES.categoriesMasterList.name, width: 90 },
      { header: XLSX_COLUMN_NAMES.categoriesMasterList.englishName, width: 90 },
      { header: XLSX_COLUMN_NAMES.categoriesMasterList.hidden, width: 10 },
      { header: XLSX_COLUMN_NAMES.categoriesMasterList.parentCategories, width: 80 },

    ];
    const categoriesHeaderRow = categoriesSheet.getRow(1);
    categoriesHeaderRow.font = { bold: true };
    categoriesHeaderRow.border = { bottom: { style: 'thin' } };

    const hierarchySheet = this.createCategoryHierarchySheet(workbook);
    const attributesSheet = this.createAttributesSheet(workbook, XLSX_COLUMN_NAMES.portionSize.categoryCode);
    const { portionSizesSheet, portionSizeWriter } = this.createPortionSizesSheet(workbook, XLSX_COLUMN_NAMES.portionSize.categoryCode, XLSX_COLUMN_NAMES.portionSize.categoryName, `'${XLSX_SHEET_NAMES.categoriesMasterList}'`);
    const standardUnitsSheet = this.createStandardUnitsSheet(workbook, XLSX_COLUMN_NAMES.portionSize.categoryCode);
    const parentPortionSheet = this.createParentPortionSheet(workbook, XLSX_COLUMN_NAMES.portionSize.categoryCode);

    const categoriesWorkbook: CategoriesWorkbook = {
      workbook,
      categoriesSheet,
      hierarchySheet,
      attributesSheet,
      portionSizesSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
      nextCategoryMasterRow: 2,
      hierarchyCategories: [],
    };

    this.categoryWorkbooks.set(localeId, categoriesWorkbook);

    return categoriesWorkbook;
  }

  private getOrCreateLocalesWorkbook(): ExcelJS.stream.xlsx.WorkbookWriter {
    if (this.localesWorkbook)
      return this.localesWorkbook;

    const filename = path.join(this.outputPath, XLSX_FILE_NAMES.locales);
    this.localesWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

    const localesSheet = this.localesWorkbook.addWorksheet(XLSX_SHEET_NAMES.locales);
    localesSheet.columns = [
      { header: XLSX_COLUMN_NAMES.locales.id, width: 20 },
      { header: XLSX_COLUMN_NAMES.locales.englishName, width: 40 },
      { header: XLSX_COLUMN_NAMES.locales.localName, width: 40 },
      { header: XLSX_COLUMN_NAMES.locales.respondentLanguage, width: 25 },
      { header: XLSX_COLUMN_NAMES.locales.adminLanguage, width: 25 },
      { header: XLSX_COLUMN_NAMES.locales.flagCode, width: 15 },
      { header: XLSX_COLUMN_NAMES.locales.textDirection, width: 15 },
      { header: XLSX_COLUMN_NAMES.locales.foodIndexLanguageBackendId, width: 35 },
    ];
    const headerRow = localesSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.border = { bottom: { style: 'thin' } };

    return this.localesWorkbook;
  }

  private writeAttributes(code: string, attributes: any, sheet: ExcelJS.Worksheet) {
    const att = attributes;
    sheet.addRow([code, xlsxBoolean(att.readyMealOption), att.reasonableAmount ?? '', xlsxBoolean(att.sameAsBeforeOption), this.encodeUseInRecipes(att.useInRecipes)]).commit();
  }

  private normalisePortionSizeOrder(portionSize: PkgV2PortionSizeMethod[]) {
    portionSize.forEach((psm, index) => {
      psm.orderBy = String(index + 1);
    });
  }

  private writeStandardPortions(code: string, portionSize: PkgV2PortionSizeMethod[], sheet: ExcelJS.Worksheet) {
    const standardPortionPsms = portionSize.filter(psm => psm.method === 'standard-portion');

    for (let i = 0; i < standardPortionPsms.length; ++i) {
      const psm = standardPortionPsms[i];
      for (const unit of psm.units) {
        const row = sheet.addRow([code, i + 1, psm.description, Number(psm.orderBy), psm.conversionFactor, unit.name, unit.weight, xlsxBoolean(unit.omitFoodDescription), unit.inlineEstimateIn, unit.inlineHowMany, psm.pathways.join('; ')]);
        row.commit();
      }
    }
  }

  private writeParentPortions(code: string, portionSize: PkgV2PortionSizeMethod[], sheet: ExcelJS.Worksheet) {
    const parentPortionPsm = portionSize.filter(psm => psm.method === 'milk-in-a-hot-drink' || psm.method === 'parent-food-portion');

    for (let i = 0; i < parentPortionPsm.length; ++i) {
      const psm = parentPortionPsm[i];

      if (psm.method === 'milk-in-a-hot-drink') {
        for (const [lang, options] of Object.entries(psm.options)) {
          for (const option of options) {
            const row = sheet.addRow([code, i + 1, psm.method, psm.description, Number(psm.orderBy), psm.conversionFactor, undefined, option.value, lang, option.label, option.shortLabel]);
            row.commit();
          }
        }
      }
      else if (psm.method === 'parent-food-portion') {
        for (const [category, categoryOptions] of Object.entries(psm.options)) {
          for (const [language, languageOptions] of Object.entries(categoryOptions)) {
            for (const option of languageOptions) {
              const row = sheet.addRow([code, i + 1, psm.method, psm.description, Number(psm.orderBy), psm.conversionFactor, category, option.value, language, option.label, option.shortLabel]);
              row.commit();
            }
          }
        }
      }
    }
  }

  public async writeFood(localeId: string, food: PkgV2Food) {
    const {
      foodsSheet,
      altNamesSheet,
      nutrientSheet,
      attributesSheet,
      tagsSheet,
      brandsSheet,
      associatedFoodsSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
    } = this.getOrCreateFoodsWorkbook(localeId);

    this.normalisePortionSizeOrder(food.portionSize);

    const parentCategories = food.parentCategories.join('; ');
    const foodRowValues = [
      food.code,
      ...(this.includeFoodActionColumn() ? ['Retain'] : []),
      food.name,
      food.englishName ?? '',
      parentCategories,
      food.thumbnailPath ?? '',
    ];
    const foodRow = foodsSheet.addRow(foodRowValues);

    foodRow.commit();

    for (const lang in food.alternativeNames) {
      for (const name of food.alternativeNames[lang]) {
        altNamesSheet.addRow([food.code, lang, name]).commit();
      }
    }

    for (const nutrientTableId in food.nutrientTableCodes) {
      const nutrientRecordId = food.nutrientTableCodes[nutrientTableId];
      nutrientSheet.addRow([food.code, nutrientTableId, nutrientRecordId]).commit();
    }

    this.writeAttributes(food.code, food.attributes, attributesSheet);

    if (food.tags !== undefined && food.tags.length > 0) {
      tagsSheet.addRow([food.code, ...food.tags.sort()]).commit();
    }

    for (const brand of food.brandNames) {
      brandsSheet.addRow([food.code, brand]).commit();
    }

    for (const assoc of food.associatedFoods) {
      const langs = new Set([...Object.keys(assoc.genericName), ...Object.keys(assoc.promptText)]);
      for (const lang of langs) {
        const generic = assoc.genericName[lang] ?? '';
        const prompt = assoc.promptText[lang] ?? '';
        associatedFoodsSheet.addRow([
          food.code,
          assoc.foodCode ?? '',
          assoc.categoryCode ?? '',
          xlsxBoolean(assoc.multiple),
          xlsxBoolean(assoc.linkAsMain),
          lang,
          generic,
          prompt,
        ]).commit();
      }
    }

    portionSizeWriter.writePortionSizeMethods(food);

    this.writeStandardPortions(food.code, food.portionSize, standardUnitsSheet);

    this.writeParentPortions(food.code, food.portionSize, parentPortionSheet);
  }

  public async writeCategory(localeId: string, category: PkgV2Category) {
    const categoryWorkbook = this.getOrCreateCategoriesWorkbook(localeId);
    const {
      categoriesSheet,
      attributesSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
      hierarchyCategories,
    } = categoryWorkbook;

    this.normalisePortionSizeOrder(category.portionSize);

    const parentCategories = category.parentCategories.join('; ');
    const masterRowNumber = categoryWorkbook.nextCategoryMasterRow++;
    categoriesSheet.addRow([
      category.code,
      category.name,
      category.englishName,
      xlsxBoolean(category.hidden),
      parentCategories,

    ]).commit();

    hierarchyCategories.push({
      code: category.code,
      name: category.name,
      englishName: category.englishName,
      hidden: category.hidden,
      parentCategories: [...category.parentCategories],
      masterRowNumber,
    });

    this.writeAttributes(category.code, category.attributes, attributesSheet);

    portionSizeWriter.writePortionSizeMethods(category);

    this.writeStandardPortions(category.code, category.portionSize, standardUnitsSheet);

    this.writeParentPortions(category.code, category.portionSize, parentPortionSheet);
  }

  public async writeLocale(locale: PkgV2Locale) {
    const workbook = this.getOrCreateLocalesWorkbook();
    const sheet = workbook.getWorksheet(XLSX_SHEET_NAMES.locales)!;

    sheet.addRow([
      locale.id,
      locale.englishName,
      locale.localName,
      locale.respondentLanguage,
      locale.adminLanguage,
      locale.flagCode,
      locale.textDirection,
      locale.foodIndexLanguageBackendId ?? '',
    ]).commit();
  }

  private getOrCreateSynonymSetsWorkbook(): ExcelJS.stream.xlsx.WorkbookWriter {
    if (this.synonymSetsWorkbook !== undefined)
      return this.synonymSetsWorkbook;

    const filename = path.join(this.outputPath, XLSX_FILE_NAMES.synonymSets);
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });
    const sheet = workbook.addWorksheet(XLSX_SHEET_NAMES.synonymSets);
    sheet.columns = [
      { header: XLSX_COLUMN_NAMES.synonymSets.locale, width: 16 },
      { header: XLSX_COLUMN_NAMES.synonymSets.synonyms, width: 120 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).border = { bottom: { style: 'thin' } };

    this.synonymSetsWorkbook = workbook;

    return workbook;
  }

  public async writeSynonymSet(localeId: string, synonymSet: PkgV2SynonymSet) {
    const workbook = this.getOrCreateSynonymSetsWorkbook();
    const sheet = workbook.getWorksheet(XLSX_SHEET_NAMES.synonymSets)!;

    sheet.addRow([localeId, synonymSet.join(' ')]).commit();
  }

  private getPortionWorkbook(): ExcelJS.stream.xlsx.WorkbookWriter {
    if (!this.portionWorkbook) {
      const filename = path.join(this.outputPath, XLSX_FILE_NAMES.portionSize);
      this.portionWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

      // As served sets sheet
      const asServedSetsSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.asServedSets);
      asServedSetsSheet.columns = [
        { header: XLSX_COLUMN_NAMES.common.id, width: 20 },
        { header: XLSX_COLUMN_NAMES.common.description, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.selectionImagePath, width: 40 },
        { header: XLSX_COLUMN_NAMES.common.labelJson, width: 50 },
      ];
      asServedSetsSheet.getRow(1).font = { bold: true };
      asServedSetsSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // As served images sheet
      const asServedImagesSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.asServedImages);
      asServedImagesSheet.columns = [
        { header: XLSX_COLUMN_NAMES.portionSizeReference.setId, width: 20 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.imagePath, width: 40 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.weight, width: 15 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.keywords, width: 50 },
        { header: XLSX_COLUMN_NAMES.common.labelJson, width: 50 },
      ];
      asServedImagesSheet.getRow(1).font = { bold: true };
      asServedImagesSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Image maps sheet
      const imageMapsSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.imageMaps);
      imageMapsSheet.columns = [
        { header: XLSX_COLUMN_NAMES.common.id, width: 20 },
        { header: XLSX_COLUMN_NAMES.common.description, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath, width: 60 },
      ];
      imageMapsSheet.getRow(1).font = { bold: true };
      imageMapsSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Image map objects sheet
      const imageMapObjectsSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.imageMapObjects);
      imageMapObjectsSheet.columns = [
        { header: XLSX_COLUMN_NAMES.portionSizeReference.imageMapId, width: 20 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId, width: 12 },
        { header: XLSX_COLUMN_NAMES.common.description, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.navigationIndex, width: 18 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates, width: 80 },
      ];
      imageMapObjectsSheet.getRow(1).font = { bold: true };
      imageMapObjectsSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Guide images sheet
      const guideImagesSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.guideImages);
      guideImagesSheet.columns = [
        { header: XLSX_COLUMN_NAMES.common.id, width: 20 },
        { header: XLSX_COLUMN_NAMES.common.description, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.imageMapId, width: 20 },
        { header: XLSX_COLUMN_NAMES.common.labelJson, width: 50 },
      ];
      guideImagesSheet.getRow(1).font = { bold: true };
      guideImagesSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Guide image objects sheet
      const guideImageObjectsSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.guideImageObjects);
      guideImageObjectsSheet.columns = [
        { header: XLSX_COLUMN_NAMES.portionSizeReference.guideImageId, width: 20 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.imageMapObjectId, width: 12 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.weight, width: 15 },
      ];
      guideImageObjectsSheet.getRow(1).font = { bold: true };
      guideImageObjectsSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Drinkware sets sheet
      const drinkwareSetsSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.drinkwareSets);
      drinkwareSetsSheet.columns = [
        { header: XLSX_COLUMN_NAMES.common.id, width: 20 },
        { header: XLSX_COLUMN_NAMES.common.description, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.selectionImageMapId, width: 25 },
        { header: XLSX_COLUMN_NAMES.common.labelJson, width: 50 },
      ];
      drinkwareSetsSheet.getRow(1).font = { bold: true };
      drinkwareSetsSheet.getRow(1).border = { bottom: { style: 'thin' } };

      // Drinkware scales sheet
      const drinkwareScalesSheet = this.portionWorkbook.addWorksheet(XLSX_SHEET_NAMES.drinkwareScales);
      drinkwareScalesSheet.columns = [
        { header: XLSX_COLUMN_NAMES.portionSizeReference.setId, width: 20 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.choiceId, width: 12 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.version, width: 10 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.baseImagePath, width: 60 },
        { header: XLSX_COLUMN_NAMES.common.labelJson, width: 50 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.width, width: 10 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.height, width: 10 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.emptyLevel, width: 12 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.fullLevel, width: 12 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.overlayImagePath, width: 60 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.outlineCoordinates, width: 80 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.volumeMethod, width: 15 },
        { header: XLSX_COLUMN_NAMES.portionSizeReference.volumeSamples, width: 80 },
      ];
      drinkwareScalesSheet.getRow(1).font = { bold: true };
      drinkwareScalesSheet.getRow(1).border = { bottom: { style: 'thin' } };
    }

    return this.portionWorkbook;
  }

  public async writeAsServedSet(set: PkgV2AsServedSet) {
    const workbook = this.getPortionWorkbook();
    const asServedSetsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.asServedSets)!;
    const asServedImagesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.asServedImages)!;

    const setRow: any[] = [
      set.id,
      set.description,
      set.selectionImagePath,
      JSON.stringify(set.label ?? {}),
    ];
    asServedSetsSheet.addRow(setRow).commit();

    for (const image of set.images) {
      const imageRow: any[] = [
        set.id,
        image.imagePath,
        image.weight,
        image.imageKeywords.join('; '),
        JSON.stringify(image.label ?? {}),
      ];
      asServedImagesSheet.addRow(imageRow).commit();
    }
  }

  public async writeImageMap(imageMap: PkgV2ImageMap) {
    const workbook = this.getPortionWorkbook();
    const imageMapsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.imageMaps)!;
    const imageMapObjectsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.imageMapObjects)!;

    const mapRow: any[] = [
      imageMap.id,
      imageMap.description,
      imageMap.baseImagePath,
    ];
    imageMapsSheet.addRow(mapRow).commit();

    for (const [objectId, object] of Object.entries(imageMap.objects)) {
      const objectRow: any[] = [
        imageMap.id,
        objectId,
        object.description,
        object.navigationIndex,
        JSON.stringify(object.outlineCoordinates),
      ];
      imageMapObjectsSheet.addRow(objectRow).commit();
    }
  }

  public async writeGuideImage(guideImage: PkgV2GuideImage) {
    const workbook = this.getPortionWorkbook();
    const guideImagesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.guideImages)!;
    const guideImageObjectsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.guideImageObjects)!;

    const guideRow: any[] = [
      guideImage.id,
      guideImage.description,
      guideImage.imageMapId,
      JSON.stringify(guideImage.label ?? {}),
    ];
    guideImagesSheet.addRow(guideRow).commit();

    for (const [objectId, weight] of Object.entries(guideImage.objectWeights)) {
      const objectRow: any[] = [
        guideImage.id,
        objectId,
        weight,
      ];
      guideImageObjectsSheet.addRow(objectRow).commit();
    }
  }

  public async writeDrinkwareSet(drinkwareSet: PkgV2DrinkwareSet) {
    const workbook = this.getPortionWorkbook();
    const drinkwareSetsSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.drinkwareSets)!;
    const drinkwareScalesSheet = workbook.getWorksheet(XLSX_SHEET_NAMES.drinkwareScales)!;

    const setRow: any[] = [
      drinkwareSet.id,
      drinkwareSet.description,
      drinkwareSet.selectionImageMapId,
      JSON.stringify(drinkwareSet.label ?? {}),
    ];
    drinkwareSetsSheet.addRow(setRow).commit();

    for (const [choiceId, scale] of Object.entries(drinkwareSet.scales)) {
      let scaleRow: any[];
      if (scale.version === 1) {
        scaleRow = [
          drinkwareSet.id,
          choiceId,
          scale.version,
          scale.baseImagePath,
          JSON.stringify({ label: scale.label }),
          scale.width,
          scale.height,
          scale.emptyLevel,
          scale.fullLevel,
          scale.overlayImagePath,
          '', // No outline coordinates for V1
          '', // No volume method for V1
          JSON.stringify(scale.volumeSamples),
        ];
      }
      else {
        scaleRow = [
          drinkwareSet.id,
          choiceId,
          scale.version,
          scale.baseImagePath,
          JSON.stringify(scale.label),
          '', // No width for V2
          '', // No height for V2
          '', // No empty level for V2
          '', // No full level for V2
          '', // No overlay image path for V2
          JSON.stringify(scale.outlineCoordinates),
          scale.volumeMethod,
          JSON.stringify(scale.volumeSamples),
        ];
      }
      drinkwareScalesSheet.addRow(scaleRow).commit();
    }
  }

  public async finalise(): Promise<Record<string, unknown>> {
    for (const foodWb of this.foodWorkbooks.values()) {
      await foodWb.workbook.commit();
    }
    for (const categoryWb of this.categoryWorkbooks.values()) {
      this.writeCategoryHierarchySheet(categoryWb);
      await categoryWb.workbook.commit();
    }
    if (this.portionWorkbook) {
      await this.portionWorkbook.commit();
    }
    if (this.localesWorkbook) {
      await this.localesWorkbook.commit();
    }
    if (this.synonymSetsWorkbook) {
      await this.synonymSetsWorkbook.commit();
    }

    return {
      workbookPaths: {
        foods: Object.fromEntries(this.foodWorkbookPaths),
        categories: Object.fromEntries(this.categoryWorkbookPaths),
      },
    };
  }
}

export function createPackageXlsxWriter(): PackageWriterFactory {
  return async (outputPath: string, exportOptions: PackageExportOptions): Promise<PackageWriter> => {
    return new PackageXlsxWriter(outputPath, exportOptions);
  };
}
