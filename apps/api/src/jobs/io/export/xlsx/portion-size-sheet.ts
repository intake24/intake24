import ExcelJS from 'exceljs';
import { groupBy, max } from 'lodash';
import { Dictionary } from '@intake24/common/types';
import { PkgV2Category } from '@intake24/common/types/package/categories';
import { PkgV2Food, PkgV2PortionSizeMethod, PkgV2PortionSizeMethodType } from '@intake24/common/types/package/foods';

interface PortionSizeColumn {
  header: string;
  width: number;
}

interface PortionSizeSection {
  method: PkgV2PortionSizeMethodType;
  overallHeader: string;
  columns: PortionSizeColumn[];
}

const portionSizeSections: PortionSizeSection[] = [
  {
    method: 'as-served',
    overallHeader: 'As served',
    columns: [
      { header: 'Serving image set ID', width: 25 },
      { header: 'Leftovers image set ID', width: 25 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Multiple option', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'guide-image',
    overallHeader: 'Guide image',
    columns: [
      { header: 'Guide image ID', width: 25 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'drink-scale',
    overallHeader: 'Drink scale',
    columns: [
      { header: 'Drinkware set ID', width: 25 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Multiple option', width: 18 },
      { header: 'Initial fill level', width: 18 },
      { header: 'Skip fill level', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'cereal',
    overallHeader: 'Cereals',
    columns: [
      { header: 'Cereal type', width: 25 },
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'milk-on-cereal',
    overallHeader: 'Milk on cereal',
    columns: [
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'pizza',
    overallHeader: 'Pizza',
    columns: [
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
  {
    method: 'pizza-v2',
    overallHeader: 'Pizza (Version 2)',
    columns: [
      { header: 'Conversion factor', width: 18 },
      { header: 'Show labels', width: 18 },
      { header: 'Use if ingredient', width: 18 },
    ],
  },
];

// 1-based
function excelCol(num: number): string {
  let s = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    s = String.fromCharCode(65 + remainder) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

export class PortionSizeWriter {
  private readonly worksheet: ExcelJS.Worksheet;
  private readonly nameReference: string;
  private currentRowIndex: number;
  private colourGroupColumn: string;
  private fixedColumns: PortionSizeColumn[];

  constructor(worksheet: ExcelJS.Worksheet, codeHeader: string, nameHeader: string, nameReference: string) {
    this.worksheet = worksheet;
    this.nameReference = nameReference;

    this.fixedColumns = [
      { header: codeHeader, width: 12 },
      { header: nameHeader, width: 70 },
      { header: '"Enter weight" option', width: 20 },
      { header: '"Don\'t know" option', width: 23 },
    ];

    function sectionColumns(section: PortionSizeSection): Partial<ExcelJS.Column>[] {
      return [
        { header: section.overallHeader, width: section.columns[0].width, style: { border: { left: { style: 'thin' } } } },
        ...section.columns.slice(1, -1).map(col => ({ header: '', width: col.width })),
        { header: '', width: section.columns[section.columns.length - 1].width, style: { border: { right: { style: 'thin' } } } },
      ];
    }

    worksheet.columns = [
      ...this.fixedColumns.map(col => ({ header: '', width: col.width })),
      ...portionSizeSections.flatMap(section => sectionColumns(section)),
      { header: '', width: 1, hidden: true },
    ];

    const firstHeaderRow = worksheet.getRow(1);
    const secondHeaderRow = worksheet.addRow([...this.fixedColumns.map(col => col.header), ...portionSizeSections.flatMap(section => section.columns.map(col => col.header)), 'Color group']);
    secondHeaderRow.font = { bold: true };
    secondHeaderRow.border = { bottom: { style: 'thin' } };

    let currentPortionSizeSectionOffset = this.fixedColumns.length + 1;

    for (const section of portionSizeSections) {
      worksheet.mergeCells(1, currentPortionSizeSectionOffset, 1, currentPortionSizeSectionOffset + section.columns.length - 1);

      const sectionHeaderCell = worksheet.getCell(1, currentPortionSizeSectionOffset);
      sectionHeaderCell.font = { bold: true, underline: true };
      sectionHeaderCell.alignment = { horizontal: 'center' };

      // Merged cell's style is copied from the first cell which doesn't have a right border, restore it
      sectionHeaderCell.border = { left: { style: 'thin' }, right: { style: 'thin' } };

      // Assigning a border to a row (after addRow above this loop) overrides all cell styles, fix the border for the first and last cells
      const firstParamHeaderCell = worksheet.getCell(2, currentPortionSizeSectionOffset);

      if (section.columns.length === 1) {
        firstParamHeaderCell.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      }
      else {
        firstParamHeaderCell.border = { left: { style: 'thin' }, bottom: { style: 'thin' } };
        const lastParamHeaderCell = worksheet.getCell(2, currentPortionSizeSectionOffset + section.columns.length - 1);
        lastParamHeaderCell.border = { right: { style: 'thin' }, bottom: { style: 'thin' } };
      }

      currentPortionSizeSectionOffset += section.columns.length;
    }

    firstHeaderRow.commit();
    secondHeaderRow.commit();

    this.currentRowIndex = 3;
    this.colourGroupColumn = excelCol(currentPortionSizeSectionOffset);

    worksheet.addConditionalFormatting({
      ref: `A3:${excelCol(currentPortionSizeSectionOffset - 1)}100000`,
      rules: [
        {
          type: 'expression',
          priority: 1,
          formulae: [`=\$${this.colourGroupColumn}3=1`],
          style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' }, bgColor: { argb: 'FFF0F0F0' } } },
        },
      ],
    });
  }

  private getParameterValues(psm: PkgV2PortionSizeMethod): any[] {
    switch (psm.method) {
      case 'as-served':
        return [
          psm.servingImageSet,
          psm.leftoversImageSet,
          psm.conversionFactor,
          psm.labels,
          psm.multiple,
          psm.useForRecipes,
        ];
      case 'guide-image':
        return [
          psm.guideImageId,
          psm.conversionFactor,
          psm.labels,
          psm.useForRecipes,
        ];
      case 'drink-scale':
        return [
          psm.drinkwareId,
          psm.conversionFactor,
          psm.labels,
          psm.multiple,
          psm.initialFillLevel,
          psm.skipFillLevel,
          psm.useForRecipes,
        ];
      case 'cereal':
        return [
          psm.type,
          psm.conversionFactor,
          psm.labels,
          psm.useForRecipes,
        ];
      case 'milk-on-cereal':
        return [
          psm.conversionFactor,
          psm.labels,
          psm.useForRecipes,
        ];
      case 'pizza':
        return [
          psm.conversionFactor,
          psm.labels,
          psm.useForRecipes,
        ];
      case 'pizza-v2':
        return [
          psm.conversionFactor,
          psm.labels,
          psm.useForRecipes,
        ];

      default:
        throw new Error(`Unexpected portion size method: ${psm.method}`);
    }
  }

  private getParameterCellValues(groupedPsm: Dictionary<PkgV2PortionSizeMethod[]>, rowIndex: number): any[] {
    return portionSizeSections.flatMap((section) => {
      const psmGroup = groupedPsm[section.method];

      if (psmGroup === undefined || psmGroup.length <= rowIndex) {
        return Array.from({ length: section.columns.length });
      }
      else {
        const parameterValues = this.getParameterValues(psmGroup[rowIndex]);
        if (parameterValues.length !== section.columns.length)
          throw new Error(`${section.method} section has ${section.columns.length} columns, but getParameterValues returned ${parameterValues.length} values`);
        return parameterValues;
      }
    });
  }

  writePortionSizeMethods(item: PkgV2Food | PkgV2Category) {
    const groupedPsm = groupBy(item.portionSize, psm => psm.method);
    const rowCount = max(Object.entries(groupedPsm).map(([_, v]) => v.length)) || 0;

    for (let i = 0; i < rowCount; ++i) {
      const rowValues: any[]
        = [
          item.code,
          '',
          groupedPsm['direct-weight'] !== undefined,
          groupedPsm.unknown !== undefined,
          ...this.getParameterCellValues(groupedPsm, i),
          '',
        ];

      const row = this.worksheet.addRow(rowValues);

      row.getCell(2).value = { formula: `VLOOKUP(A${this.currentRowIndex}, ${this.nameReference}!A:B, 2, FALSE)` };

      const colourGroupCell = row.getCell(this.colourGroupColumn);
      if (this.currentRowIndex === 3) {
        colourGroupCell.value = 0;
      }
      else {
        colourGroupCell.value = { formula: `IF(A${this.currentRowIndex}=A${this.currentRowIndex - 1}, ${this.colourGroupColumn}${this.currentRowIndex - 1}, 1 - ${this.colourGroupColumn}${this.currentRowIndex - 1})` };
      }

      row.commit();
      ++this.currentRowIndex;
    }
  }
}
