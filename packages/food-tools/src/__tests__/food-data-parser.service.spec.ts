import { describe, expect, it } from 'vitest';
import { FoodDataParserService, USE_IN_RECIPE_TYPES } from '../services/food-data-parser.service';

describe('foodDataParserService', () => {
  const service = new FoodDataParserService();

  describe('getLanguageCode', () => {
    it('should return known language codes', () => {
      expect(service.getLanguageCode('jp_JP_2024')).toBe('ja');
      expect(service.getLanguageCode('en_GB')).toBe('en');
      expect(service.getLanguageCode('en_AU')).toBe('en');
    });

    it('should extract language code from unknown locales', () => {
      expect(service.getLanguageCode('de_DE')).toBe('de');
      expect(service.getLanguageCode('es_MX_2023')).toBe('es');
    });
  });

  describe('parseBoolean', () => {
    it('should return true for truthy strings', () => {
      expect(service.parseBoolean('true')).toBe(true);
      expect(service.parseBoolean('TRUE')).toBe(true);
      expect(service.parseBoolean('1')).toBe(true);
      expect(service.parseBoolean('yes')).toBe(true);
      expect(service.parseBoolean('YES')).toBe(true);
      expect(service.parseBoolean('y')).toBe(true);
      expect(service.parseBoolean('Y')).toBe(true);
    });

    it('should return false for falsy strings', () => {
      expect(service.parseBoolean('false')).toBe(false);
      expect(service.parseBoolean('0')).toBe(false);
      expect(service.parseBoolean('no')).toBe(false);
      expect(service.parseBoolean('n')).toBe(false);
      expect(service.parseBoolean('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(service.parseBoolean(null)).toBe(false);
      expect(service.parseBoolean(undefined)).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(service.parseNumber('123')).toBe(123);
      expect(service.parseNumber('12.5')).toBe(12.5);
      expect(service.parseNumber('-5')).toBe(-5);
      expect(service.parseNumber('0')).toBe(0);
    });

    it('should return undefined for invalid numbers', () => {
      expect(service.parseNumber('')).toBeUndefined();
      expect(service.parseNumber('abc')).toBeUndefined();
      expect(service.parseNumber(null)).toBeUndefined();
      expect(service.parseNumber(undefined)).toBeUndefined();
    });
  });

  describe('parseUseInRecipes', () => {
    it('should parse USE_ANYWHERE values', () => {
      expect(service.parseUseInRecipes('anywhere')).toBe(USE_IN_RECIPE_TYPES.USE_ANYWHERE);
      expect(service.parseUseInRecipes('Anywhere')).toBe(USE_IN_RECIPE_TYPES.USE_ANYWHERE);
      expect(service.parseUseInRecipes('0')).toBe(USE_IN_RECIPE_TYPES.USE_ANYWHERE);
    });

    it('should parse USE_AS_REGULAR_FOOD values', () => {
      expect(service.parseUseInRecipes('regularfoodsonly')).toBe(USE_IN_RECIPE_TYPES.USE_AS_REGULAR_FOOD);
      expect(service.parseUseInRecipes('regular')).toBe(USE_IN_RECIPE_TYPES.USE_AS_REGULAR_FOOD);
      expect(service.parseUseInRecipes('1')).toBe(USE_IN_RECIPE_TYPES.USE_AS_REGULAR_FOOD);
    });

    it('should parse USE_AS_RECIPE_INGREDIENT values', () => {
      expect(service.parseUseInRecipes('recipesonly')).toBe(USE_IN_RECIPE_TYPES.USE_AS_RECIPE_INGREDIENT);
      expect(service.parseUseInRecipes('recipes')).toBe(USE_IN_RECIPE_TYPES.USE_AS_RECIPE_INGREDIENT);
      expect(service.parseUseInRecipes('2')).toBe(USE_IN_RECIPE_TYPES.USE_AS_RECIPE_INGREDIENT);
    });

    it('should return undefined for unknown values', () => {
      expect(service.parseUseInRecipes('unknown')).toBeUndefined();
      expect(service.parseUseInRecipes('')).toBeUndefined();
      expect(service.parseUseInRecipes(null)).toBeUndefined();
    });
  });

  describe('parseCategories', () => {
    it('should parse comma-separated categories', () => {
      expect(service.parseCategories('CAT1, CAT2, CAT3')).toEqual(['CAT1', 'CAT2', 'CAT3']);
    });

    it('should trim whitespace', () => {
      expect(service.parseCategories('  CAT1 ,  CAT2  ')).toEqual(['CAT1', 'CAT2']);
    });

    it('should filter empty values', () => {
      expect(service.parseCategories('CAT1,,CAT2,,')).toEqual(['CAT1', 'CAT2']);
    });

    it('should return empty array for empty input', () => {
      expect(service.parseCategories('')).toEqual([]);
      expect(service.parseCategories(null)).toEqual([]);
      expect(service.parseCategories(undefined)).toEqual([]);
    });
  });

  describe('parseAlternativeNames', () => {
    it('should parse synonyms under language code', () => {
      const result = service.parseAlternativeNames('ja', 'synonym1, synonym2', null, null);
      expect(result).toEqual({ ja: ['synonym1', 'synonym2'] });
    });

    it('should include brand names', () => {
      const result = service.parseAlternativeNames('en', 'synonym1', 'Brand A, Brand B', null);
      expect(result.en).toContain('synonym1');
      expect(result.en).toContain('Brand A');
      expect(result.en).toContain('Brand B');
    });

    it('should include brand names as search terms', () => {
      const result = service.parseAlternativeNames('en', null, null, 'SearchBrand');
      expect(result).toEqual({ en: ['SearchBrand'] });
    });

    it('should deduplicate terms', () => {
      const result = service.parseAlternativeNames('en', 'term', 'term', 'term');
      expect(result).toEqual({ en: ['term'] });
    });

    it('should return empty object for no terms', () => {
      expect(service.parseAlternativeNames('en', null, null, null)).toEqual({});
      expect(service.parseAlternativeNames('en', '', '', '')).toEqual({});
    });
  });

  describe('parseFoodTags', () => {
    it('should generate composition tag', () => {
      expect(service.parseFoodTags('AUSNUT')).toEqual(['composition-ausnut']);
      expect(service.parseFoodTags('STFCJ')).toEqual(['composition-stfcj']);
    });

    it('should return empty array for no composition table', () => {
      expect(service.parseFoodTags('')).toEqual([]);
      expect(service.parseFoodTags(null)).toEqual([]);
    });
  });

  describe('parseNutrientTableCodes', () => {
    it('should parse table and record ID', () => {
      expect(service.parseNutrientTableCodes('AUSNUT', '12345', {})).toEqual({ AUSNUT: '12345' });
    });

    it('should use default mapping', () => {
      expect(service.parseNutrientTableCodes('DCD for Japan', '12345', {})).toEqual({ DCDJapan: '12345' });
    });

    it('should use custom mapping', () => {
      expect(service.parseNutrientTableCodes('Custom', '12345', { Custom: 'CUSTOM' })).toEqual({ CUSTOM: '12345' });
    });

    it('should return empty for invalid values', () => {
      expect(service.parseNutrientTableCodes('', '12345', {})).toEqual({});
      expect(service.parseNutrientTableCodes('AUSNUT', '', {})).toEqual({});
      expect(service.parseNutrientTableCodes('AUSNUT', 'N/A', {})).toEqual({});
      expect(service.parseNutrientTableCodes('AUSNUT', '-', {})).toEqual({});
    });

    it('should skip invalid record IDs', () => {
      expect(service.parseNutrientTableCodes('AUSNUT', 'path/to/file', {})).toEqual({});
      expect(service.parseNutrientTableCodes('AUSNUT', 'a'.repeat(51), {})).toEqual({});
    });
  });

  describe('tokenizeAssociatedFoods', () => {
    it('should tokenize simple codes', () => {
      const result = service.tokenizeAssociatedFoods('CODE1, CODE2');
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('CODE1');
      expect(result[1].code).toBe('CODE2');
    });

    it('should parse codes with prompts', () => {
      const result = service.tokenizeAssociatedFoods('CODE1(en: "Add sugar?")');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('CODE1');
      expect(result[0].prompts).toHaveProperty('en', 'Add sugar?');
    });

    it('should handle codes with whitespace before parens', () => {
      const result = service.tokenizeAssociatedFoods('CODE1 (prompt text)');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('CODE1');
      expect(result[0].rawPrompt).toBe('prompt text');
    });

    it('should handle nested braces', () => {
      const result = service.tokenizeAssociatedFoods('CODE1({en: "test"})');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('CODE1');
    });

    it('should skip malformed entries', () => {
      const result = service.tokenizeAssociatedFoods('CODE1, invalid-code!, CODE2');
      expect(result.map(r => r.code)).toContain('CODE1');
      expect(result.map(r => r.code)).toContain('CODE2');
    });
  });

  describe('parsePortionSizeMethods', () => {
    it('should parse as-served method', () => {
      const result = service.parsePortionSizeMethods('Method: as-served, servingImageSet: my-set');
      expect(result).toHaveLength(1);
      expect(result[0].method).toBe('as-served');
      expect(result[0].parameters).toHaveProperty('servingImageSet', 'my-set');
    });

    it('should parse standard-portion method with units', () => {
      const result = service.parsePortionSizeMethods('Method: standard-portion, unitscount: 2, unit0-name: slice, unit0-weight: 30, unit1-name: whole, unit1-weight: 100');
      expect(result).toHaveLength(1);
      expect(result[0].method).toBe('standard-portion');
      const units = result[0].parameters.units as any[];
      expect(units).toHaveLength(2);
      expect(units[0].name).toBe('slice');
      expect(units[0].weight).toBe(30);
    });

    it('should parse multiple methods', () => {
      const result = service.parsePortionSizeMethods('Method: as-served Method: direct-weight');
      expect(result).toHaveLength(2);
      expect(result[0].method).toBe('as-served');
      expect(result[1].method).toBe('direct-weight');
    });

    it('should return empty array for empty input', () => {
      expect(service.parsePortionSizeMethods('')).toEqual([]);
      expect(service.parsePortionSizeMethods(null)).toEqual([]);
    });
  });

  describe('parsePortionSizeMethod', () => {
    it('should parse drink-scale method', () => {
      const result = service.parsePortionSizeMethod('drink-scale, drinkwareId: mug-01, initialFillLevel: 0.8');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('drink-scale');
      expect(result!.parameters.drinkwareId).toBe('mug-01');
      expect(result!.parameters.initialFillLevel).toBe(0.8);
    });

    it('should parse guide-image method', () => {
      const result = service.parsePortionSizeMethod('guide-image, guideImageId: bread-01');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('guide-image');
      expect(result!.parameters.guideImageId).toBe('bread-01');
    });

    it('should parse cereal method', () => {
      const result = service.parsePortionSizeMethod('cereal, type: hoop');
      expect(result).not.toBeNull();
      expect(result!.method).toBe('cereal');
      expect(result!.parameters.type).toBe('hoop');
    });

    it('should handle conversion factor', () => {
      const result = service.parsePortionSizeMethod('direct-weight, conversion: 0.5');
      expect(result).not.toBeNull();
      expect(result!.conversionFactor).toBe(0.5);
    });

    it('should default conversion factor to 1.0', () => {
      const result = service.parsePortionSizeMethod('direct-weight');
      expect(result).not.toBeNull();
      expect(result!.conversionFactor).toBe(1.0);
    });

    it('should return null for empty input', () => {
      expect(service.parsePortionSizeMethod('')).toBeNull();
      expect(service.parsePortionSizeMethod('   ')).toBeNull();
    });

    it('should return null for unknown method', () => {
      expect(service.parsePortionSizeMethod('unknown-method-xyz')).toBeNull();
    });
  });
});
