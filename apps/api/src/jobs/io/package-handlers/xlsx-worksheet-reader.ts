import type ExcelJS from 'exceljs';

import type { Dictionary } from '@intake24/common/types';

import path from 'node:path';

import ExcelJSWorkbook from 'exceljs';

export type XlsxHeaderSpec = {
  key?: string;
  name: string;
  optional: boolean;
};

type XlsxParsedHeaders = {
  headerIndices: Map<string, number>;
  headerNamesByIndex: Map<number, string>;
};

export type XlsxFileContext = {
  fileName: string;
};

export type XlsxSheetContext = XlsxFileContext & {
  sheetName: string;
};

export type XlsxRowContext = XlsxSheetContext & {
  rowNumber: number;
};

export type XlsxCellContext = XlsxRowContext & {
  columnName: string;
  columnIndex: string;
};

export type XlsxValidationContext = XlsxCellContext | XlsxSheetContext | XlsxRowContext | XlsxFileContext;

export type XlsxValidationErrorKey
  = | 'associatedFoodCodeNotFound'
    | 'cellCannotBeEmpty'
    | 'cellInvalidValue'
    | 'foodCodeNotFound'
    | 'invalidHeader'
    | 'missingColumn'
    | 'missingSheet';

export type XlsxValidationErrorLogger = (
  context: XlsxValidationContext,
  key: XlsxValidationErrorKey,
  params?: Dictionary,
) => void;

const PATH_SEPARATOR_REGEX = /[\\/]+/;

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;

  if (value && typeof value === 'object') {
    if ('result' in value)
      return value.result;
    // ExcelJS bug workaround
    // A formula cell only carries `result` when its cached value is truthy. ExcelJS omits
    // `result` when it is falsy, so `=FALSE()` becomes `{ formula: 'FALSE()' }` with no
    // `result`.
    if ('formula' in value) {
      const formula = String(value.formula).trim().toUpperCase();
      if (formula === 'TRUE()' || formula === 'TRUE')
        return true;
      if (formula === 'FALSE()' || formula === 'FALSE')
        return false;
      return undefined;
    }
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

function cellAsOptionalString(cell: ExcelJS.Cell | undefined): string | undefined {
  if (!cell)
    return undefined;

  const value = cellAsString(cell);
  return value.trim() === '' ? undefined : value;
}

function cellAsBool(cell: ExcelJS.Cell): boolean | undefined {
  const value = cellValue(cell);

  if (value === null || value === undefined || value === '')
    return undefined;

  if (typeof value === 'boolean')
    return value;

  const normalised = String(value).trim().toLowerCase();

  if (['true', 'yes', 'y'].includes(normalised))
    return true;
  if (['false', 'no', 'n'].includes(normalised))
    return false;

  return undefined;
}

function excelColumnIndex(columnNumber: number): string {
  let columnIndex = '';
  let remaining = columnNumber;

  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    columnIndex = String.fromCharCode(65 + remainder) + columnIndex;
    remaining = Math.floor((remaining - 1) / 26);
  }

  return columnIndex;
}

function resolvePackagePath(sourcePath: string, relativePath: string): string {
  const pathParts = relativePath.split(PATH_SEPARATOR_REGEX);

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

export class XlsxWorkbookReader {
  private readonly fileContext: XlsxFileContext;

  static async fromFile(
    sourcePath: string,
    fileName: string,
    addValidationError: XlsxValidationErrorLogger,
  ): Promise<XlsxWorkbookReader> {
    const workbook = new ExcelJSWorkbook.Workbook();
    await workbook.xlsx.readFile(resolvePackagePath(sourcePath, fileName));
    return new XlsxWorkbookReader(fileName, workbook, addValidationError);
  }

  private constructor(
    fileName: string,
    private readonly excelWorkbook: ExcelJS.Workbook,
    private readonly addValidationError: XlsxValidationErrorLogger,
  ) {
    this.fileContext = { fileName };
  }

  private getWorksheet(sheetName: string): ExcelJS.Worksheet | undefined {
    const worksheet = this.excelWorkbook.getWorksheet(sheetName);

    if (!worksheet)
      this.addValidationError({ ...this.fileContext, sheetName }, 'missingSheet');

    return worksheet;
  }

  getWorksheetReader(
    sheetName: string,
    expectedHeaders: XlsxHeaderSpec[],
    headerRowNumber = 1,
  ): XlsxWorksheetReader | undefined {
    const worksheet = this.getWorksheet(sheetName);

    if (!worksheet)
      return undefined;

    const sheetContext: XlsxSheetContext = { ...this.fileContext, sheetName: worksheet.name };
    const headers = this.parseHeaders(sheetContext, worksheet, expectedHeaders, headerRowNumber);

    if (!headers)
      return undefined;

    return new XlsxWorksheetReader(sheetContext, worksheet, headers.headerIndices, headers.headerNamesByIndex, this.addValidationError);
  }

  private parseHeaders(
    context: XlsxSheetContext,
    worksheet: ExcelJS.Worksheet,
    expectedHeaders: XlsxHeaderSpec[],
    rowNumber = 1,
  ): XlsxParsedHeaders | undefined {
    const headerIndices = new Map<string, number>();
    const headerNamesByIndex = new Map<number, string>();
    const row = worksheet.getRow(rowNumber);
    let colNumber = 1;
    let valid = true;

    for (const expected of expectedHeaders) {
      const expectedName = expected.name;
      const expectedKey = expected.key ?? expected.name;
      const actualName = cellAsString(row.getCell(colNumber));

      if (XlsxWorkbookReader.normaliseHeader(actualName) === XlsxWorkbookReader.normaliseHeader(expectedName)) {
        headerIndices.set(expectedKey, colNumber);
        headerNamesByIndex.set(colNumber, expectedName);
        colNumber++;
        continue;
      }

      if (expected.optional)
        continue;

      this.addValidationError(
        { ...context, rowNumber, columnName: expectedName, columnIndex: excelColumnIndex(colNumber) },
        actualName ? 'invalidHeader' : 'missingColumn',
        { actualHeader: actualName },
      );
      valid = false;
      colNumber++;
    }

    return valid ? { headerIndices, headerNamesByIndex } : undefined;
  }

  private static normaliseHeader(header: string): string {
    return header.toLowerCase();
  }
}

export class XlsxWorksheetReader {
  constructor(
    private readonly sheetContext: XlsxSheetContext,
    private readonly worksheet: ExcelJS.Worksheet,
    private readonly headerIndices: Map<string, number>,
    private readonly headerNamesByIndex: Map<number, string>,
    private readonly addValidationError: XlsxValidationErrorLogger,
  ) {}

  forEachRow(callback: (row: ExcelJS.Row, rowNumber: number) => void): void {
    this.worksheet.eachRow(callback);
  }

  getColumnIndex(columnName: string): number {
    const columnIndex = this.headerIndices.get(columnName);

    if (!columnIndex)
      throw new Error(`Missing column "${columnName}" in sheet "${this.worksheet.name}" -- this should have been detected earlier`);

    return columnIndex;
  }

  getOptionalColumnIndex(columnName: string): number | undefined {
    return this.headerIndices.get(columnName);
  }

  getColumnIndices<T extends Record<string, string>>(columnNames: T): { [K in keyof T]: number } {
    const columns = {} as { [K in keyof T]: number };

    for (const key of Object.keys(columnNames) as (keyof T)[])
      columns[key] = this.getColumnIndex(columnNames[key]);

    return columns;
  }

  cellAsString(rowNumber: number, columnIndex: number): string {
    return cellAsString(this.cell(rowNumber, columnIndex));
  }

  cellAsOptionalString(rowNumber: number, columnIndex: number | undefined): string | undefined {
    return cellAsOptionalString(this.optionalCell(rowNumber, columnIndex));
  }

  cellAsBool(rowNumber: number, columnIndex: number | undefined): boolean | undefined {
    const cell = this.optionalCell(rowNumber, columnIndex);
    return cell ? cellAsBool(cell) : undefined;
  }

  cellAsNonEmptyString(rowNumber: number, columnIndex: number): string | undefined {
    const context = this.cellContextForColumnIndex(rowNumber, columnIndex);
    const value = cellAsOptionalString(this.worksheet.getRow(rowNumber).getCell(columnIndex));

    if (value === undefined) {
      this.logValidationError(context, 'cellCannotBeEmpty');
      return undefined;
    }

    return value;
  }

  cellAsRegexString(
    rowNumber: number,
    columnIndex: number,
    pattern: RegExp,
    expected: string,
  ): string | undefined {
    const value = this.cellAsNonEmptyString(rowNumber, columnIndex);

    if (value === undefined)
      return undefined;

    if (!pattern.test(value)) {
      this.logValidationError(this.cellContextForColumnIndex(rowNumber, columnIndex), 'cellInvalidValue', { expected, value });
      return undefined;
    }

    return value;
  }

  cellAsNumber(rowNumber: number, columnIndex: number): number | undefined {
    const value = this.cellAsNonEmptyString(rowNumber, columnIndex);

    if (value === undefined)
      return undefined;

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      this.logValidationError(this.cellContextForColumnIndex(rowNumber, columnIndex), 'cellInvalidValue', { expected: 'number', value });
      return undefined;
    }

    return parsed;
  }

  cellAsEnum<T extends string>(
    rowNumber: number,
    columnIndex: number,
    values: Set<T>,
    expected: string,
  ): T | undefined {
    const value = this.cellAsNonEmptyString(rowNumber, columnIndex);

    if (value === undefined)
      return undefined;

    if (!values.has(value as T)) {
      this.logValidationError(this.cellContextForColumnIndex(rowNumber, columnIndex), 'cellInvalidValue', { expected, value });
      return undefined;
    }

    return value as T;
  }

  cellAsJson<T>(rowNumber: number, columnIndex: number, fallback: T): T | undefined {
    const value = this.cellAsOptionalString(rowNumber, columnIndex);

    if (value === undefined)
      return fallback;

    try {
      return JSON.parse(value) as T;
    }
    catch {
      this.logValidationError(this.cellContextForColumnIndex(rowNumber, columnIndex), 'cellInvalidValue', { expected: 'JSON', value });
      return undefined;
    }
  }

  private columnName(columnIndex: number): string {
    const columnName = this.headerNamesByIndex.get(columnIndex);

    if (!columnName)
      throw new Error(`Missing header name for column "${columnIndex}" in sheet "${this.worksheet.name}" -- this should have been detected earlier`);

    return columnName;
  }

  private cell(rowNumber: number, columnIndex: number): ExcelJS.Cell {
    return this.worksheet.getRow(rowNumber).getCell(columnIndex);
  }

  private optionalCell(rowNumber: number, columnIndex: number | undefined): ExcelJS.Cell | undefined {
    return columnIndex ? this.worksheet.getRow(rowNumber).getCell(columnIndex) : undefined;
  }

  cellContext(rowNumber: number, columnIndex: number): XlsxCellContext {
    return this.cellContextForColumnIndex(rowNumber, columnIndex);
  }

  private cellContextForColumnIndex(rowNumber: number, columnIndex: number): XlsxCellContext {
    return { ...this.sheetContext, rowNumber, columnName: this.columnName(columnIndex), columnIndex: excelColumnIndex(columnIndex) };
  }

  private logValidationError(
    context: XlsxValidationContext,
    key: XlsxValidationErrorKey,
    params?: Dictionary,
  ): void {
    this.addValidationError(context, key, params);
  }
}
