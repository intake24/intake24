import path from 'node:path';
import ExcelJS from 'exceljs';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';

export function createPackageXlsxWriter() {
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

      // Alternative Names sheet (removed Locale)
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

      const portionSizesSheet = workbook.addWorksheet('Portion size');

      /*
        'as-served',
  'cereal',
  'direct-weight',
  'drink-scale',
  'guide-image',
  'milk-in-a-hot-drink',
  'milk-on-cereal',
  'parent-food-portion',
  'pizza',
  'pizza-v2',
  'recipe-builder',
  'standard-portion',
  'unknown',
      */

      const asServedStyle: Partial<ExcelJS.Style> = { }; // { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F9FF' } } } as const;
      const guideImageStyle: Partial<ExcelJS.Style> = { }; // { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6FFF4' } } } as const;
      const drinkScaleStyle: Partial<ExcelJS.Style> = { }; // { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBF2' } } } as const;
      const cerealStyle: Partial<ExcelJS.Style> = { }; // { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2FFFF' } } } as const;

      portionSizesSheet.columns = [
        // A
        { header: 'Food code', width: 12 },
        // B
        { header: 'Food name', width: 70 },
        // Direct weight (C)
        { header: 'Weight input option', width: 18 },
        // Unknown (D)
        { header: '"Don\'t know" option', width: 19 },
        // As served (E-I)
        { header: 'Serving image set ID', width: 25, style: { ...asServedStyle, border: { left: { style: 'thin' } } } },
        { header: 'Leftovers image set ID', width: 25, style: asServedStyle },
        { header: 'Conversion factor', width: 18, style: asServedStyle },
        { header: 'Multiple option', width: 18, style: asServedStyle },
        { header: 'Use if ingredient', width: 18, style: { ...asServedStyle, border: { right: { style: 'thin' } } } },
        // Guide image (J-L)
        { header: 'Guide image ID', width: 25, border: { left: { style: 'thin' } }, style: { ...guideImageStyle, border: { left: { style: 'thin' } } } },
        { header: 'Conversion factor', width: 18, style: guideImageStyle },
        { header: 'Use if ingredient', width: 18, border: { right: { style: 'thin' } }, style: { ...guideImageStyle, border: { right: { style: 'thin' } } } },
        // Drink scale (M-R)
        { header: 'Drinkware set ID', width: 25, border: { left: { style: 'thin' } }, style: { ...drinkScaleStyle, border: { left: { style: 'thin' } } } },
        { header: 'Conversion factor', width: 18, style: drinkScaleStyle },
        { header: 'Multiple option', width: 18, style: drinkScaleStyle },
        { header: 'Initial fill level', width: 18, style: drinkScaleStyle },
        { header: 'Skip fill level', width: 18, style: drinkScaleStyle },
        { header: 'Use if ingredient', width: 18, border: { right: { style: 'thin' } }, style: { ...drinkScaleStyle, border: { right: { style: 'thin' } } } },
        // Cereal (S-T)
        { header: 'Cereal type', width: 25, border: { left: { style: 'thin' } }, style: { ...cerealStyle, border: { left: { style: 'thin' } } } },
        { header: 'Conversion factor', width: 18, border: { right: { style: 'thin' } }, style: { ...cerealStyle, border: { right: { style: 'thin' } } } },
        // Helper (U)
        { header: '', width: 1, hidden: true },
      ];

      portionSizesSheet.addRow(portionSizesSheet.columns.map(col => col.header));

      const portionSizesHeaderRow = portionSizesSheet.getRow(2);
      portionSizesHeaderRow.font = { bold: true };
      portionSizesHeaderRow.border = { bottom: { style: 'thin' } };

      const mergeCellsAndFixColumns = (fromCol: string, toCol: string, value: string) => {
        portionSizesSheet.mergeCells(`${fromCol}1:${toCol}1`);
        const mergedCell = portionSizesSheet.getCell(`${fromCol}1`);
        mergedCell.value = value;
        mergedCell.border = { left: { style: 'thin' }, right: { style: 'thin' } };
        portionSizesSheet.getCell(`${fromCol}2`).border = { left: { style: 'thin' }, bottom: { style: 'thin' } };
        portionSizesSheet.getCell(`${toCol}2`).border = { right: { style: 'thin' }, bottom: { style: 'thin' } };
      };

      portionSizesSheet.mergeCells('A1:D1');
      portionSizesSheet.getCell('A1').value = '';

      mergeCellsAndFixColumns('E', 'I', 'As served');
      mergeCellsAndFixColumns('J', 'L', 'Guide image');
      mergeCellsAndFixColumns('M', 'R', 'Drink scale');
      mergeCellsAndFixColumns('S', 'T', 'Cereals');

      const groupHeaderRow = portionSizesSheet.getRow(1);
      groupHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      groupHeaderRow.font = { bold: true };

      let currentDataRow = 3;

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
        attributesSheet.addRow([food.code, att.readyMealOption ?? '', att.reasonableAmount ?? '', att.sameAsBeforeOption ?? '', encodeUseInRecipes(att.useInRecipes)]).commit();

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
              assoc.multiple ?? '',
              assoc.linkAsMain ?? '',
              lang,
              generic,
              prompt,
            ]).commit();
          }
        }

        // Portion sizes sheet
        const portionGroups = new Map<string, typeof food.portionSize[0][]>();
        for (const psm of food.portionSize) {
          if (!portionGroups.has(psm.method))
            portionGroups.set(psm.method, []);
          portionGroups.get(psm.method)!.push(psm);
        }

        const maxRows = Math.max(...Array.from(portionGroups.values(), arr => arr.length), 0);

        for (let i = 0; i < maxRows; i++) {
          const rowValues: any[] = Array.from({ length: 20 }).fill('');

          rowValues[0] = food.code;

          for (const [_method, list] of portionGroups) {
            if (i >= list.length)
              continue;
            const psm = list[i];

            switch (psm.method) {
              case 'direct-weight':
                rowValues[2] = true;
                break;
              case 'unknown':
                rowValues[3] = true;
                break;
              case 'as-served':
                rowValues[4] = psm.servingImageSet;
                rowValues[5] = psm.leftoversImageSet ?? '';
                rowValues[6] = psm.conversionFactor;
                rowValues[7] = psm.multiple ?? '';
                rowValues[8] = psm.useForRecipes ?? '';
                break;
              case 'guide-image':
                rowValues[9] = psm.guideImageId;
                rowValues[10] = psm.conversionFactor;
                rowValues[11] = psm.useForRecipes ?? '';
                break;
              case 'drink-scale':
                rowValues[12] = psm.drinkwareId;
                rowValues[13] = psm.conversionFactor;
                rowValues[14] = (psm as any).multiple ?? false;
                rowValues[15] = psm.initialFillLevel;
                rowValues[16] = psm.skipFillLevel ?? '';
                rowValues[17] = psm.useForRecipes ?? '';
                break;
              case 'cereal':
                rowValues[18] = psm.type;
                rowValues[19] = psm.conversionFactor;
                break;
              // Other methods skipped as no dedicated columns in the new structure
            }
          }

          const excelRow = portionSizesSheet.addRow(rowValues);
          excelRow.getCell(2).value = { formula: `VLOOKUP(A${currentDataRow}, 'Foods master list'!A:B, 2, FALSE)` };

          const helperCell = excelRow.getCell(21);
          if (currentDataRow === 3) {
            helperCell.value = 0;
          }
          else {
            helperCell.value = { formula: `IF(A${currentDataRow}=A${currentDataRow - 1}, U${currentDataRow - 1}, 1 - U${currentDataRow - 1})` };
          }

          excelRow.commit();
          currentDataRow++;
        }
      }

      portionSizesSheet.addConditionalFormatting({
        ref: 'A3:T100000',
        rules: [
          {
            type: 'expression',
            priority: 1,
            formulae: ['=$U3=1'],
            style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' }, bgColor: { argb: 'FFF0F0F0' } } },
          },
        ],
      });

      await workbook.commit();
    }
  };
}
