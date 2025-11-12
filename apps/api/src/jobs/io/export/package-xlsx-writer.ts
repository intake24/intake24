import path from 'node:path';
import ExcelJS from 'exceljs';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';

export function createPackageXlsxWriter() {
  function encodeBoolean(v: boolean | undefined): string {
    if (v === undefined)
      return '';
    else if (v)
      return 'Y';
    return 'N';
  }

  function encodeUseInRecipes(useInRecipes: number | undefined): string {
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

  return async (tempDirPath: string, exportOptions: PackageExportOptions, packageStreams: PackageDataStreams): Promise<void> => {
    for (const localeId of exportOptions.locales) {
      if (!packageStreams[localeId]?.foods)
        continue;

      const filename = path.join(tempDirPath, `${localeId}.xlsx`);
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });

      // Foods sheet (removed Locale, Alternative Names, Nutrient Table Codes)
      const foodsSheet = workbook.addWorksheet('Foods');
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

      // Alternative Names sheet (removed Locale)
      const altNamesSheet = workbook.addWorksheet('Alternative Names');
      altNamesSheet.columns = [
        { header: 'Code', width: 12 },
        { header: 'Language', width: 10 },
        { header: 'Alternative Name', width: 40 },
      ];
      const altNamesHeaderRow = altNamesSheet.getRow(1);
      altNamesHeaderRow.font = { bold: true };
      altNamesHeaderRow.border = { bottom: { style: 'thin' } };

      // Nutrient Table Codes sheet
      const nutrientSheet = workbook.addWorksheet('Nutrient Table Codes');
      nutrientSheet.columns = [
        { header: 'Code', width: 12 },
        { header: 'Nutrient Table Id', width: 30 },
        { header: 'Nutrient Record Id', width: 30 },
      ];
      const nutrientHeaderRow = nutrientSheet.getRow(1);
      nutrientHeaderRow.font = { bold: true };
      nutrientHeaderRow.border = { bottom: { style: 'thin' } };

      // Attributes sheet (removed Locale)
      const attributesSheet = workbook.addWorksheet('Attributes');
      attributesSheet.columns = [
        { header: 'Code', width: 12 },
        { header: 'Ready Meal Option', width: 20 },
        { header: 'Reasonable Amount', width: 20 },
        { header: 'Same As Before Option', width: 25 },
        { header: 'Use In Recipes', width: 15 },
      ];

      const attributesHeaderRow = attributesSheet.getRow(1);
      attributesHeaderRow.font = { bold: true };
      attributesHeaderRow.border = { bottom: { style: 'thin' } };

      // Tags

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

      // Brands sheet (removed Locale)
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
        { header: 'Associated Food Code', width: 20 },
        { header: 'Associated Category Code', width: 25 },
        { header: 'Multiple', width: 10 },
        { header: 'Link As Main', width: 15 },
        { header: 'Language', width: 10 },
        { header: 'Generic Name', width: 30 },
        { header: 'Prompt Text', width: 60 },
      ];
      const associatedFoodsHeaderRow = associatedFoodsSheet.getRow(1);
      associatedFoodsHeaderRow.font = { bold: true };
      associatedFoodsHeaderRow.border = { bottom: { style: 'thin' } };

      // Portion sizes sheet (removed Locale)
      const portionSizesSheet = workbook.addWorksheet('Portion sizes');
      portionSizesSheet.columns = [
        { header: 'Code', width: 12 },
        { header: 'Method', width: 15 },
        { header: 'Description', width: 30 },
        { header: 'Conversion Factor', width: 15 },
        { header: 'Use For Recipes', width: 15 },
        { header: 'Serving Image Set', width: 20 },
        { header: 'Leftovers Image Set', width: 20 },
        { header: 'Multiple', width: 10 },
        { header: 'Guide Image Id', width: 20 },
        { header: 'Drinkware Id', width: 20 },
        { header: 'Initial Fill Level', width: 15 },
        { header: 'Skip Fill Level', width: 15 },
        { header: 'Type', width: 15 },
        { header: 'Labels', width: 30 },
        { header: 'Units', width: 30 },
        { header: 'Options', width: 30 },
      ];
      const portionSizesHeaderRow = portionSizesSheet.getRow(1);
      portionSizesHeaderRow.font = { bold: true };
      portionSizesHeaderRow.border = { bottom: { style: 'thin' } };

      for await (const food of packageStreams[localeId].foods!) {
        // Foods sheet
        const parentCategories = food.parentCategories.join('; ');
        foodsSheet.addRow([food.code, food.name, food.englishName ?? '', parentCategories, food.thumbnailPath ?? '']).commit();

        // Alternative Names sheet
        for (const lang in food.alternativeNames) {
          for (const name of food.alternativeNames[lang]) {
            altNamesSheet.addRow([food.code, lang, name]).commit();
          }
        }

        // Nutrient Table Codes sheet
        for (const nutrientTableId in food.nutrientTableCodes) {
          const nutrientRecordId = food.nutrientTableCodes[nutrientTableId];
          nutrientSheet.addRow([food.code, nutrientTableId, nutrientRecordId]).commit();
        }

        // Attributes sheet
        const att = food.attributes;
        attributesSheet.addRow([food.code, encodeBoolean(att.readyMealOption), att.reasonableAmount ?? '', encodeBoolean(att.sameAsBeforeOption), encodeUseInRecipes(att.useInRecipes)]).commit();

        if (food.tags !== undefined && food.tags.length > 0) {
          tagsSheet.addRow([food.code, ...food.tags.sort()]).commit();
        }

        // Brands sheet
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
              encodeBoolean(assoc.multiple),
              encodeBoolean(assoc.linkAsMain),
              lang,
              generic,
              prompt,
            ]).commit();
          }
        }

        // Portion sizes sheet
        for (const psm of food.portionSize) {
          const common = [food.code, psm.method, psm.description, psm.conversionFactor, psm.useForRecipes];
          let specifics: (string | number | boolean | undefined)[] = [];

          switch (psm.method) {
            case 'as-served':
              specifics = [psm.servingImageSet, psm.leftoversImageSet ?? '', psm.multiple, '', '', '', '', '', '', '', ''];
              break;
            case 'guide-image':
              specifics = ['', '', '', psm.guideImageId, '', '', '', '', '', '', ''];
              break;
            case 'drink-scale':
              specifics = ['', '', '', '', psm.drinkwareId, psm.initialFillLevel, psm.skipFillLevel, '', '', '', ''];
              break;
            case 'standard-portion':
              specifics = ['', '', '', '', '', '', '', '', '', JSON.stringify(psm.units), ''];
              break;
            case 'cereal':
              specifics = ['', '', '', '', '', '', '', psm.type, '', '', ''];
              break;
            case 'milk-on-cereal':
              specifics = ['', '', '', '', '', '', '', '', JSON.stringify(psm.labels), '', ''];
              break;
            case 'pizza':
              specifics = ['', '', '', '', '', '', '', '', JSON.stringify(psm.labels), '', ''];
              break;
            case 'milk-in-a-hot-drink':
              specifics = ['', '', '', '', '', '', '', '', '', '', JSON.stringify(psm.options)];
              break;
          }

          portionSizesSheet.addRow([...common, ...specifics]).commit();
        }
      }

      await workbook.commit();
    }
  };
}
