import { describe, expect, it } from 'vitest';
import { CsvParserService } from '../services/csv-parser.service';

describe('csvParserService', () => {
  const service = new CsvParserService();

  describe('normalizeHeaderName', () => {
    it('should convert to lowercase', () => {
      expect(service.normalizeHeaderName('FoodCode')).toBe('foodcode');
    });

    it('should replace spaces with underscores', () => {
      expect(service.normalizeHeaderName('Food Code')).toBe('food_code');
    });

    it('should remove special characters', () => {
      expect(service.normalizeHeaderName('Food (Code)')).toBe('food_code');
    });

    it('should remove BOM character', () => {
      expect(service.normalizeHeaderName('\uFEFFIntake24 Code')).toBe('intake24_code');
    });

    it('should trim whitespace', () => {
      expect(service.normalizeHeaderName('  food code  ')).toBe('food_code');
    });

    it('should handle multiple spaces', () => {
      expect(service.normalizeHeaderName('food   code')).toBe('food_code');
    });
  });

  describe('normalizeHeaders', () => {
    it('should normalize all headers', () => {
      const headers = ['Food Code', 'English Description', 'Local Description'];
      expect(service.normalizeHeaders(headers)).toEqual([
        'food_code',
        'english_description',
        'local_description',
      ]);
    });

    it('should handle duplicate headers by appending suffix', () => {
      const headers = ['Code', 'Code', 'Code'];
      expect(service.normalizeHeaders(headers)).toEqual(['code', 'code_2', 'code_3']);
    });

    it('should handle empty headers with column index', () => {
      const headers = ['Code', '', 'Description'];
      const result = service.normalizeHeaders(headers);
      expect(result[0]).toBe('code');
      expect(result[1]).toBe('column_1');
      expect(result[2]).toBe('description');
    });
  });

  describe('findHeaderLineIndex', () => {
    it('should find header line with "intake24 code"', () => {
      const content = 'Title\nSubtitle\nIntake24 Code,Name,Description\nDATA1,Name1,Desc1';
      expect(service.findHeaderLineIndex(content)).toBe(2);
    });

    it('should find header line case-insensitively', () => {
      const content = 'Title\nINTAKE24 CODE,Name\nData';
      expect(service.findHeaderLineIndex(content)).toBe(1);
    });

    it('should return -1 if no header found', () => {
      const content = 'Code,Name\nData1,Name1';
      expect(service.findHeaderLineIndex(content)).toBe(-1);
    });
  });

  describe('identifyCategoryColumns', () => {
    it('should identify category columns starting from "categories"', () => {
      const header = ['Code', 'Name', 'Categories', '', '', 'Other'];
      const normalized = ['code', 'name', 'categories', 'column_3', 'column_4', 'other'];
      expect(service.identifyCategoryColumns(header, normalized)).toEqual([
        'categories',
        'column_3',
        'column_4',
      ]);
    });

    it('should stop at non-empty column', () => {
      const header = ['Code', 'Categories', '', 'Description'];
      const normalized = ['code', 'categories', 'column_2', 'description'];
      expect(service.identifyCategoryColumns(header, normalized)).toEqual([
        'categories',
        'column_2',
      ]);
    });
  });

  describe('getColumnValue', () => {
    it('should return first matching alias value', () => {
      const record = { code: 'ABC123', name: 'Test' };
      expect(service.getColumnValue(record, ['code', 'food_code'])).toBe('ABC123');
    });

    it('should return second alias if first not found', () => {
      const record = { food_code: 'ABC123', name: 'Test' };
      expect(service.getColumnValue(record, ['code', 'food_code'])).toBe('ABC123');
    });

    it('should return empty string if no alias matches', () => {
      const record = { name: 'Test' };
      expect(service.getColumnValue(record, ['code', 'food_code'])).toBe('');
    });

    it('should skip empty values', () => {
      const record = { code: '', food_code: 'ABC123' };
      expect(service.getColumnValue(record, ['code', 'food_code'])).toBe('ABC123');
    });

    it('should trim whitespace', () => {
      const record = { code: '  ABC123  ' };
      expect(service.getColumnValue(record, ['code'])).toBe('ABC123');
    });

    it('should convert numbers to strings', () => {
      const record = { code: 123 };
      expect(service.getColumnValue(record, ['code'])).toBe('123');
    });
  });

  describe('collectCategories', () => {
    it('should collect values from category columns', () => {
      const record = { cat1: 'A', cat2: 'B', cat3: 'C' };
      expect(service.collectCategories(record, ['cat1', 'cat2', 'cat3'])).toEqual(['A', 'B', 'C']);
    });

    it('should split comma-separated values', () => {
      const record = { categories: 'A, B, C' };
      expect(service.collectCategories(record, ['categories'])).toEqual(['A', 'B', 'C']);
    });

    it('should deduplicate categories', () => {
      const record = { cat1: 'A', cat2: 'A, B' };
      expect(service.collectCategories(record, ['cat1', 'cat2'])).toEqual(['A', 'B']);
    });

    it('should skip empty values', () => {
      const record = { cat1: 'A', cat2: '', cat3: 'B' };
      expect(service.collectCategories(record, ['cat1', 'cat2', 'cat3'])).toEqual(['A', 'B']);
    });

    it('should use default "categories" column if no keys provided', () => {
      const record = { categories: 'A, B' };
      expect(service.collectCategories(record, [])).toEqual(['A', 'B']);
    });
  });

  describe('parse', () => {
    it('should parse CSV content', () => {
      const content = 'Intake24 Code,Name,Action\nABC,Test Food,2';
      const result = service.parse(content, 0);

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toHaveProperty('intake24_code', 'ABC');
      expect(result.records[0]).toHaveProperty('name', 'Test Food');
      expect(result.records[0]).toHaveProperty('action', '2');
    });

    it('should throw error for empty content', () => {
      expect(() => service.parse('', 0)).toThrow('CSV content is empty');
    });

    it('should throw error for whitespace-only content', () => {
      expect(() => service.parse('   \n\n  ', 0)).toThrow('CSV content is empty');
    });

    it('should handle CRLF line endings', () => {
      const content = 'Intake24 Code,Name\r\nABC,Test';
      const result = service.parse(content, 0);
      expect(result.records).toHaveLength(1);
    });

    it('should identify category columns', () => {
      const content = 'Intake24 Code,Categories,,Other\nABC,Cat1,Cat2,Val';
      const result = service.parse(content, 0);
      expect(result.categoryColumnKeys).toContain('categories');
    });
  });
});
