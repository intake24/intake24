/**
 * CSV parsing service with encoding detection and normalization
 */

import { readFileSync } from 'node:fs';
import chardet from 'chardet';
import { parse as parseCsv } from 'csv-parse/sync';
import iconv from 'iconv-lite';

export interface ParsedCsvResult {
  records: Record<string, unknown>[];
  headerNames: string[];
  dataStartLine: number;
  categoryColumnKeys: string[];
}

export interface EncodingResult {
  content: string;
  detectedEncoding: string;
  wasConverted: boolean;
}

export interface Logger {
  info: (message: string, meta?: object) => void;
  warn: (message: string, meta?: object) => void;
  error: (message: string, meta?: object) => void;
  debug: (message: string, meta?: object) => void;
}

/**
 * Default console logger for standalone usage
 */
export const defaultLogger: Logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => console.debug(`[DEBUG] ${msg}`),
};

/**
 * CsvParserService provides robust CSV parsing with:
 * - Automatic encoding detection (chardet)
 * - Encoding conversion (iconv-lite)
 * - Header normalization
 * - Category column identification
 */
export class CsvParserService {
  private logger: Logger;

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
  }

  /**
   * Parse CSV content with automatic header detection
   */
  parse(content: string, skipHeaderRows: number = 0): ParsedCsvResult {
    if (!content || content.trim() === '') {
      throw new Error('CSV content is empty');
    }

    const headerLineIndex = this.findHeaderLineIndex(content);
    const effectiveHeaderIndex = headerLineIndex >= 0
      ? headerLineIndex
      : Math.max(skipHeaderRows - 1, 0);
    const fromLine = effectiveHeaderIndex + 1;
    const dataStartLine = effectiveHeaderIndex + 2; // 1-based line number of first data row

    let headerNames: string[] = [];
    let categoryColumnKeys: string[] = [];

    const records = parseCsv(content, {
      columns: (header: string[]) => {
        headerNames = this.normalizeHeaders(header);
        categoryColumnKeys = this.identifyCategoryColumns(header, headerNames);
        return headerNames;
      },
      from_line: fromLine,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    }) as Record<string, unknown>[];

    return { records, headerNames, dataStartLine, categoryColumnKeys };
  }

  /**
   * Read a file with automatic encoding detection and conversion to UTF-8
   * Uses chardet for detection and iconv-lite for conversion
   */
  readFileWithEncodingDetection(filePath: string): EncodingResult {
    // Read file as buffer first
    const buffer = readFileSync(filePath);

    // Detect encoding
    const detectedEncoding = chardet.detect(buffer) || 'UTF-8';
    this.logger.info(`Detected file encoding: ${detectedEncoding}`);

    const isUtf8 = detectedEncoding.toUpperCase() === 'UTF-8'
      || detectedEncoding.toUpperCase() === 'ASCII';

    if (isUtf8) {
      // Already UTF-8, decode directly
      return {
        content: buffer.toString('utf8'),
        detectedEncoding,
        wasConverted: false,
      };
    }

    // Need to convert from detected encoding to UTF-8
    this.logger.warn(`File is encoded as ${detectedEncoding}, converting to UTF-8...`);

    // Check if iconv-lite supports this encoding
    if (!iconv.encodingExists(detectedEncoding)) {
      this.logger.warn(`Encoding ${detectedEncoding} not supported by iconv-lite, attempting direct decode`);
      return {
        content: buffer.toString('utf8'),
        detectedEncoding,
        wasConverted: false,
      };
    }

    const content = iconv.decode(buffer, detectedEncoding);
    this.logger.info(`Successfully converted from ${detectedEncoding} to UTF-8`);

    return {
      content,
      detectedEncoding,
      wasConverted: true,
    };
  }

  /**
   * Find the line index containing the header row
   * Looks for "intake24 code" pattern
   */
  findHeaderLineIndex(content: string): number {
    const lines = content.split(/\r?\n/);
    return lines.findIndex(line => /intake24\s*code/i.test(line));
  }

  /**
   * Normalize headers to consistent lowercase snake_case format
   */
  normalizeHeaders(headers: string[]): string[] {
    const seen = new Map<string, number>();

    return headers.map((header, index) => {
      const normalized = this.normalizeHeaderName(header);
      const baseCandidate = normalized || `column_${index}`;

      const count = seen.get(baseCandidate) ?? 0;
      seen.set(baseCandidate, count + 1);

      if (count > 0) {
        return `${baseCandidate}_${count + 1}`;
      }

      return baseCandidate;
    });
  }

  /**
   * Normalize a single header name
   */
  normalizeHeaderName(header: string): string {
    return header
      .replace(/^\uFEFF/, '') // Remove BOM
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Identify category columns in the CSV
   * Categories section starts with "categories" header and continues through adjacent empty headers
   */
  identifyCategoryColumns(header: string[], normalized: string[]): string[] {
    const categoryKeys: string[] = [];
    let inCategorySection = false;

    header.forEach((original, index) => {
      const trimmed = original?.trim();
      const key = normalized[index];

      if (trimmed?.toLowerCase() === 'categories') {
        inCategorySection = true;
        categoryKeys.push(key);
        return;
      }

      if (inCategorySection && (!trimmed || trimmed.length === 0)) {
        categoryKeys.push(key);
        return;
      }

      if (inCategorySection) {
        inCategorySection = false;
      }
    });

    return categoryKeys;
  }

  /**
   * Get column value with multiple alias support
   */
  getColumnValue(record: Record<string, unknown>, aliases: string[]): string {
    for (const alias of aliases) {
      const value = record[alias];
      if (value !== undefined && value !== null) {
        const stringValue = typeof value === 'string' ? value : String(value);
        const trimmedValue = stringValue.trim();
        if (trimmedValue.length > 0) {
          return trimmedValue;
        }
      }
    }
    return '';
  }

  /**
   * Collect category values from multiple columns
   */
  collectCategories(record: Record<string, unknown>, categoryColumnKeys: string[]): string[] {
    const values: string[] = [];
    const keys = categoryColumnKeys.length ? categoryColumnKeys : ['categories'];

    for (const key of keys) {
      const value = record[key];
      if (value === undefined || value === null) {
        continue;
      }

      const stringValue = typeof value === 'string' ? value : String(value);
      const trimmed = stringValue.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.includes(',')) {
        trimmed.split(',').forEach((part) => {
          const token = part.trim();
          if (token) {
            values.push(token);
          }
        });
      }
      else {
        values.push(trimmed);
      }
    }

    return [...new Set(values)];
  }
}

// Export singleton for convenience
export const csvParserService = new CsvParserService();
