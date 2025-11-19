import path from 'node:path';
import ExcelJS from 'exceljs';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import { PkgV2Category } from '@intake24/common/types/package/categories';
import { PkgV2Food, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';
import { PackageWriter, PackageWriterFactory } from '../types';
import { PortionSizeWriter } from './portion-size-sheet';

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
  attributesSheet: ExcelJS.Worksheet;
  portionSizesSheet: ExcelJS.Worksheet;
  portionSizeWriter: PortionSizeWriter;
  standardUnitsSheet: ExcelJS.Worksheet;
  parentPortionSheet: ExcelJS.Worksheet;
}

export class PackageXlsxWriter implements PackageWriter {
  private outputPath: string;
  private exportOptions: PackageExportOptions;
  private foodWorkbooks: Map<string, FoodsWorkbook> = new Map();
  private categoryWorkbooks: Map<string, CategoriesWorkbook> = new Map();
  private portionWorkbook?: ExcelJS.stream.xlsx.WorkbookWriter;

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

  private createAttributesSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const attributesSheet = workbook.addWorksheet('Attributes');
    attributesSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: 'Ready Meal Option', width: 20 },
      { header: 'Reasonable Amount', width: 20 },
      { header: 'Same As Before Option', width: 25 },
      { header: 'Use In Recipes', width: 15 },
    ];
    const attributesHeaderRow = attributesSheet.getRow(1);
    attributesHeaderRow.font = { bold: true };
    attributesHeaderRow.border = { bottom: { style: 'thin' } };
    return attributesSheet;
  }

  private createPortionSizesSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string, nameHeader: string, nameReference: string): { portionSizesSheet: ExcelJS.Worksheet; portionSizeWriter: PortionSizeWriter } {
    const portionSizesSheet = workbook.addWorksheet('Portion size');
    const portionSizeWriter = new PortionSizeWriter(portionSizesSheet, codeHeader, nameHeader, nameReference);
    return { portionSizesSheet, portionSizeWriter };
  }

  private createStandardUnitsSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const standardUnitsSheet = workbook.addWorksheet('Standard units');
    standardUnitsSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: 'Portion size option', width: 20 },
      { header: 'Description', width: 26 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Standard unit ID', width: 26 },
      { header: 'Unit weight', width: 12 },
      { header: 'Omit food name', width: 16 },
      { header: 'Inline estimate in', width: 80 },
      { header: 'Inline how many', width: 80 },
    ];
    standardUnitsSheet.getRow(1).font = { bold: true };
    standardUnitsSheet.getRow(1).border = { bottom: { style: 'thin' } };
    return standardUnitsSheet;
  }

  private createParentPortionSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, codeHeader: string): ExcelJS.Worksheet {
    const parentPortionSheet = workbook.addWorksheet('Parent food portion');
    parentPortionSheet.columns = [
      { header: codeHeader, width: 12 },
      { header: 'Portion size option', width: 20 },
      { header: 'Method type', width: 20 },
      { header: 'Description', width: 26 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Category', width: 20 },
      { header: 'Parent portion', width: 60 },
      { header: 'Language', width: 18 },
      { header: 'Label', width: 60 },
      { header: 'Short label', width: 60 },
    ];
    parentPortionSheet.getRow(1).font = { bold: true };
    parentPortionSheet.getRow(1).border = { bottom: { style: 'thin' } };
    return parentPortionSheet;
  }

  private getOrCreateFoodsWorkbook(localeId: string): FoodsWorkbook {
    const existingWb = this.foodWorkbooks.get(localeId);
    if (existingWb !== undefined)
      return existingWb;

    const filename = path.join(this.outputPath, `foods-${localeId}.xlsx`);
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

    const foodsSheet = workbook.addWorksheet('Foods master list');
    foodsSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Name', width: 120 },
      { header: 'English Name', width: 120 },
      { header: 'Parent Categories', width: 80 },
      { header: 'Thumbnail Path', width: 80 },
    ];
    const foodsHeaderRow = foodsSheet.getRow(1);
    foodsHeaderRow.font = { bold: true };
    foodsHeaderRow.border = { bottom: { style: 'thin' } };

    const altNamesSheet = workbook.addWorksheet('Alt. names');
    altNamesSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Language', width: 10 },
      { header: 'Alternative Name', width: 40 },
    ];
    const altNamesHeaderRow = altNamesSheet.getRow(1);
    altNamesHeaderRow.font = { bold: true };
    altNamesHeaderRow.border = { bottom: { style: 'thin' } };

    const nutrientSheet = workbook.addWorksheet('Nutrient mapping');
    nutrientSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Nutrient Table Id', width: 30 },
      { header: 'Nutrient Record Id', width: 30 },
    ];
    const nutrientHeaderRow = nutrientSheet.getRow(1);
    nutrientHeaderRow.font = { bold: true };
    nutrientHeaderRow.border = { bottom: { style: 'thin' } };

    const tagsSheet = workbook.addWorksheet('Tags');
    const tagsColumns = [
      { header: 'Code', width: 12 },
    ];
    for (let i = 1; i <= 12; i++) {
      tagsColumns.push({ header: `Tag ${i}`, width: 30 });
    }
    tagsSheet.columns = tagsColumns;
    const tagsHeaderRow = tagsSheet.getRow(1);
    tagsHeaderRow.font = { bold: true };
    tagsHeaderRow.border = { bottom: { style: 'thin' } };

    const brandsSheet = workbook.addWorksheet('Brands');
    brandsSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Brand Name', width: 30 },
    ];
    const brandsHeaderRow = brandsSheet.getRow(1);
    brandsHeaderRow.font = { bold: true };
    brandsHeaderRow.border = { bottom: { style: 'thin' } };

    const associatedFoodsSheet = workbook.addWorksheet('Associated foods');
    associatedFoodsSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Associated food code', width: 20 },
      { header: 'Associated category code', width: 25 },
      { header: 'Multiple', width: 10 },
      { header: 'Link as main', width: 15 },
      { header: 'Language', width: 10 },
      { header: 'Generic name', width: 30 },
      { header: 'Prompt text', width: 60 },
    ];
    const associatedFoodsHeaderRow = associatedFoodsSheet.getRow(1);
    associatedFoodsHeaderRow.font = { bold: true };
    associatedFoodsHeaderRow.border = { bottom: { style: 'thin' } };

    const attributesSheet = this.createAttributesSheet(workbook, 'Food code');
    const { portionSizesSheet, portionSizeWriter } = this.createPortionSizesSheet(workbook, 'Food code', 'Food name', `'Foods master list'`);
    const standardUnitsSheet = this.createStandardUnitsSheet(workbook, 'Food code');
    const parentPortionSheet = this.createParentPortionSheet(workbook, 'Food code');

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

    const filename = path.join(this.outputPath, `categories-${localeId}.xlsx`);
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

    const categoriesSheet = workbook.addWorksheet('Categories master list');
    categoriesSheet.columns = [
      { header: 'Code', width: 12 },
      { header: 'Name', width: 90 },
      { header: 'English name', width: 90 },
      { header: 'Hidden', width: 10 },
      { header: 'Parent categories', width: 80 },

    ];
    const categoriesHeaderRow = categoriesSheet.getRow(1);
    categoriesHeaderRow.font = { bold: true };
    categoriesHeaderRow.border = { bottom: { style: 'thin' } };

    const attributesSheet = this.createAttributesSheet(workbook, 'Category code');
    const { portionSizesSheet, portionSizeWriter } = this.createPortionSizesSheet(workbook, 'Category code', 'Category name', `'Categories master list'`);
    const standardUnitsSheet = this.createStandardUnitsSheet(workbook, 'Category code');
    const parentPortionSheet = this.createParentPortionSheet(workbook, 'Category code');

    const categoriesWorkbook: CategoriesWorkbook = {
      workbook,
      categoriesSheet,
      attributesSheet,
      portionSizesSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
    };

    this.categoryWorkbooks.set(localeId, categoriesWorkbook);

    return categoriesWorkbook;
  }

  private writeAttributes(code: string, attributes: any, sheet: ExcelJS.Worksheet) {
    const att = attributes;
    sheet.addRow([code, att.readyMealOption ?? '', att.reasonableAmount ?? '', att.sameAsBeforeOption ?? '', this.encodeUseInRecipes(att.useInRecipes)]).commit();
  }

  private writeStandardPortions(code: string, portionSize: PkgV2PortionSizeMethod[], sheet: ExcelJS.Worksheet) {
    const standardPortionPsms = portionSize.filter(psm => psm.method === 'standard-portion');

    for (let i = 0; i < standardPortionPsms.length; ++i) {
      const psm = standardPortionPsms[i];
      for (const unit of psm.units) {
        const row = sheet.addRow([code, i + 1, psm.description, psm.conversionFactor, unit.name, unit.weight, unit.omitFoodDescription, unit.inlineEstimateIn, unit.inlineHowMany]);
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
            const row = sheet.addRow([code, i + 1, psm.method, psm.description, psm.conversionFactor, undefined, option.value, lang, option.label, option.shortLabel]);
            row.commit();
          }
        }
      }
      else if (psm.method === 'parent-food-portion') {
        for (const [category, categoryOptions] of Object.entries(psm.options)) {
          for (const [language, languageOptions] of Object.entries(categoryOptions)) {
            for (const option of languageOptions) {
              const row = sheet.addRow([code, i + 1, psm.method, psm.description, psm.conversionFactor, category, option.value, language, option.label, option.shortLabel]);
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

    const parentCategories = food.parentCategories.join('; ');
    foodsSheet.addRow([food.code, food.name, food.englishName ?? '', parentCategories, food.thumbnailPath ?? '']).commit();

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
          assoc.multiple ?? '',
          assoc.linkAsMain ?? '',
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
    const {
      categoriesSheet,
      attributesSheet,
      portionSizeWriter,
      standardUnitsSheet,
      parentPortionSheet,
    } = this.getOrCreateCategoriesWorkbook(localeId);

    const parentCategories = category.parentCategories.join('; ');
    categoriesSheet.addRow([
      category.code,
      category.name,
      category.englishName,
      category.hidden,
      parentCategories,

    ]).commit();

    this.writeAttributes(category.code, category.attributes, attributesSheet);

    portionSizeWriter.writePortionSizeMethods(category);

    this.writeStandardPortions(category.code, category.portionSize, standardUnitsSheet);

    this.writeParentPortions(category.code, category.portionSize, parentPortionSheet);
  }

  private getPortionWorkbook(): {
    workbook: ExcelJS.stream.xlsx.WorkbookWriter;
    asServedSetsSheet: ExcelJS.Worksheet;
    asServedImagesSheet: ExcelJS.Worksheet;
  } {
    if (!this.portionWorkbook) {
      const filename = path.join(this.outputPath, `portion-size.xlsx`);
      this.portionWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

      const asServedSetsSheet = this.portionWorkbook.addWorksheet('As served sets');
      asServedSetsSheet.columns = [
        { header: 'ID', width: 20 },
        { header: 'Description', width: 50 },
        { header: 'Selection Image Path', width: 40 },
        { header: 'Label JSON', width: 50 },
      ];
      const setsHeaderRow = asServedSetsSheet.getRow(1);
      setsHeaderRow.font = { bold: true };
      setsHeaderRow.border = { bottom: { style: 'thin' } };

      const asServedImagesSheet = this.portionWorkbook.addWorksheet('As served images');
      asServedImagesSheet.columns = [
        { header: 'Set ID', width: 20 },
        { header: 'Image Path', width: 40 },
        { header: 'Weight', width: 15 },
        { header: 'Keywords', width: 50 },
        { header: 'Label JSON', width: 50 },
      ];
      const imagesHeaderRow = asServedImagesSheet.getRow(1);
      imagesHeaderRow.font = { bold: true };
      imagesHeaderRow.border = { bottom: { style: 'thin' } };
    }

    const asServedSetsSheet = this.portionWorkbook.getWorksheet('As served sets')!;
    const asServedImagesSheet = this.portionWorkbook.getWorksheet('As served images')!;

    return {
      workbook: this.portionWorkbook,
      asServedSetsSheet,
      asServedImagesSheet,
    };
  }

  public async writeAsServedSet(set: PkgV2AsServedSet) {
    const {
      asServedSetsSheet,
      asServedImagesSheet,
    } = this.getPortionWorkbook();

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

  public async finish(): Promise<void> {
    for (const foodWb of this.foodWorkbooks.values()) {
      await foodWb.workbook.commit();
    }
    for (const categoryWb of this.categoryWorkbooks.values()) {
      await categoryWb.workbook.commit();
    }
    if (this.portionWorkbook) {
      await this.portionWorkbook.commit();
    }
  }
}

export function createPackageXlsxWriter(): PackageWriterFactory {
  return async (outputPath: string, exportOptions: PackageExportOptions): Promise<PackageWriter> => {
    return new PackageXlsxWriter(outputPath, exportOptions);
  };
}
