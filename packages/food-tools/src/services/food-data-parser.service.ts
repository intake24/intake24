/**
 * Food data parsing service for transforming raw CSV values into typed food data
 */

import type {
  CerealType,
  PortionSizeMethod,
  StandardUnit,
} from '@intake24/common/surveys';
import type { Logger } from './csv-parser.service';

// UseInRecipeType enum values (matching API types)
export const USE_IN_RECIPE_TYPES = {
  USE_ANYWHERE: 0,
  USE_AS_REGULAR_FOOD: 1,
  USE_AS_RECIPE_INGREDIENT: 2,
} as const;

export type UseInRecipeType = (typeof USE_IN_RECIPE_TYPES)[keyof typeof USE_IN_RECIPE_TYPES];

// Re-export imported types for convenience
export type { PortionSizeMethod, StandardUnit };

/**
 * Tokenized associated food entry
 */
export interface TokenizedAssociatedFood {
  code: string;
  prompts: Record<string, string>;
  rawPrompt?: string;
}

/**
 * Default nutrient table mappings
 */
export const DEFAULT_NUTRIENT_TABLE_MAPPINGS: Record<string, string> = {
  AUSNUT: 'AUSNUT',
  STFCJ: 'STFCJ',
  'DCD for Japan': 'DCDJapan',
  NDNS: 'NDNS',
  USDA: 'USDA',
  FCT: 'FCT',
};

/**
 * Default locale to language code mappings
 */
export const LOCALE_TO_LANGUAGE: Record<string, string> = {
  jp_JP_2024: 'ja',
  en_GB: 'en',
  en_AU: 'en',
  en_NZ: 'en',
  fr_FR: 'fr',
  pt_BR: 'pt',
};

/**
 * FoodDataParserService provides utilities for parsing food-related data fields
 */
export class FoodDataParserService {
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Maps a locale ID to its language code for use in altNames.
   * E.g., jp_JP_2024 -> ja, en_GB -> en
   */
  getLanguageCode(localeId: string): string {
    return LOCALE_TO_LANGUAGE[localeId] || localeId.split('_')[0].toLowerCase();
  }

  /**
   * Parse boolean value from string
   */
  parseBoolean(value: string | undefined | null): boolean {
    if (!value) {
      return false;
    }
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  }

  /**
   * Parse number value from string
   */
  parseNumber(value: string | undefined | null): number | undefined {
    if (!value) {
      return undefined;
    }
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? undefined : num;
  }

  /**
   * Parse UseInRecipes value from string
   * "Anywhere" or "0" → USE_ANYWHERE (0)
   * "RegularFoodsOnly" or "1" → USE_AS_REGULAR_FOOD (1)
   * "RecipesOnly" or "2" → USE_AS_RECIPE_INGREDIENT (2)
   */
  parseUseInRecipes(value: string | undefined | null): UseInRecipeType | undefined {
    if (!value) {
      return undefined;
    }

    const normalizedValue = value.toLowerCase().trim();

    if (normalizedValue === 'anywhere' || normalizedValue === '0') {
      return USE_IN_RECIPE_TYPES.USE_ANYWHERE;
    }
    if (normalizedValue === 'regularfoodsonly' || normalizedValue === 'regular' || normalizedValue === '1') {
      return USE_IN_RECIPE_TYPES.USE_AS_REGULAR_FOOD;
    }
    if (normalizedValue === 'recipesonly' || normalizedValue === 'recipes' || normalizedValue === '2') {
      return USE_IN_RECIPE_TYPES.USE_AS_RECIPE_INGREDIENT;
    }

    // Unknown value - return undefined to let it inherit from category/defaults
    return undefined;
  }

  /**
   * Parse categories from comma-separated string
   */
  parseCategories(value: string | undefined | null): string[] {
    if (!value) {
      return [];
    }
    return value.split(',').map(cat => cat.trim()).filter(Boolean);
  }

  /**
   * Parses synonyms and brand names from CSV into altNames structure.
   *
   * Synonyms are stored under the language code key (e.g., "ja" for Japanese)
   * to enable proper language-based search indexing.
   */
  parseAlternativeNames(
    languageCode: string,
    synonyms: string | undefined | null,
    brandNames: string | undefined | null,
    brandNamesAsSearchTerms: string | undefined | null,
  ): Record<string, string[]> {
    const altNames: Record<string, string[]> = {};

    const parseList = (value: string | undefined | null): string[] =>
      value
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    // Collect all search terms: synonyms + brand names
    const allTerms = new Set<string>();

    // Add synonyms
    if (synonyms) {
      for (const term of parseList(synonyms)) {
        allTerms.add(term);
      }
    }

    // Add brand names as search terms
    for (const source of [brandNames, brandNamesAsSearchTerms]) {
      if (!source) {
        continue;
      }
      for (const term of parseList(source)) {
        allTerms.add(term);
      }
    }

    // Store all terms under the language code key
    if (allTerms.size > 0) {
      altNames[languageCode] = [...allTerms];
    }

    return altNames;
  }

  /**
   * Parse food composition table tags
   */
  parseFoodTags(foodCompositionTable: string | undefined | null): string[] {
    const tags: string[] = [];
    if (foodCompositionTable) {
      tags.push(`composition-${foodCompositionTable.toLowerCase()}`);
    }
    return tags;
  }

  /**
   * Tokenize associated foods string into structured entries
   */
  tokenizeAssociatedFoods(value: string): TokenizedAssociatedFood[] {
    const entries: TokenizedAssociatedFood[] = [];

    const normalized = value.replace(/\r\n/g, '\n');
    const parts: string[] = [];
    let current = '';
    let parenDepth = 0;
    let braceDepth = 0;

    for (const char of normalized) {
      if (char === '(') {
        parenDepth++;
      }
      else if (char === ')' && parenDepth > 0) {
        parenDepth--;
      }
      else if (char === '{') {
        braceDepth++;
      }
      else if (char === '}' && braceDepth > 0) {
        braceDepth--;
      }

      if (char === ',' && parenDepth === 0 && braceDepth === 0) {
        if (current.trim().length > 0) {
          parts.push(current.trim());
        }
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim().length > 0) {
      parts.push(current.trim());
    }

    for (const part of parts) {
      // Allow optional whitespace between code and parentheses
      const match = part.match(/^(\w+)\s*(?:\((.*)\))?$/);

      if (!match) {
        this.logger?.warn(`Skipping unrecognised associated food fragment: "${part}"`);
        continue;
      }

      const code = match[1];
      const payload = match[2]?.trim() ?? '';

      const prompts = payload ? this.parsePromptTranslations(payload) : {};
      const rawPrompt = Object.keys(prompts).length > 0
        ? Object.values(prompts)[0]
        : this.extractRawPrompt(payload);

      entries.push({
        code,
        prompts,
        rawPrompt: rawPrompt || undefined,
      });
    }

    return entries;
  }

  /**
   * Parse prompt translations from payload string
   */
  private parsePromptTranslations(payload: string): Record<string, string> {
    let content = payload.trim();
    const translations: Record<string, string> = {};

    if (!content) {
      return translations;
    }

    if (content.startsWith('{') && content.endsWith('}')) {
      content = content.slice(1, -1);
    }

    if (!content) {
      return translations;
    }

    // eslint-disable-next-line regexp/no-super-linear-backtracking -- complex regex for parsing key-value pairs
    const regex = /([\w-]+)\s*:\s*([^,]+(?:(?=,\s*[\w-]+\s*:)|$))/g;
    let match: RegExpExecArray | null;

    // eslint-disable-next-line no-cond-assign -- standard regex exec pattern
    while ((match = regex.exec(content)) !== null) {
      const key = match[1].trim();
      let value = match[2].trim();

      if (!key) {
        continue;
      }

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1);
      }

      value = value.trim();
      if (!value) {
        continue;
      }

      translations[key] = value;
    }

    return translations;
  }

  /**
   * Extract raw prompt from payload
   */
  private extractRawPrompt(payload: string): string {
    if (!payload) {
      return '';
    }

    let text = payload.trim();

    if (text.startsWith('{') && text.endsWith('}')) {
      text = text.slice(1, -1);
    }

    text = text.replace(/^["']|["']$/g, '').trim();
    return text;
  }

  /**
   * Parse nutrient table codes from CSV values
   */
  parseNutrientTableCodes(
    table: string | undefined | null,
    recordId: string | undefined | null,
    tableMapping: Record<string, string> = {},
  ): Record<string, string> {
    if (!table || !recordId) {
      return {};
    }

    // Skip empty or placeholder values
    const trimmedTable = table.trim();
    const trimmedRecordId = recordId.trim();

    if (trimmedTable === '' || trimmedRecordId === '' || trimmedRecordId === 'N/A' || trimmedRecordId === '-') {
      return {};
    }

    const defaultMapping = { ...DEFAULT_NUTRIENT_TABLE_MAPPINGS, ...tableMapping };
    const tableCode = defaultMapping[trimmedTable] || trimmedTable;

    // Skip if record ID looks invalid
    if (trimmedRecordId.includes('/') || trimmedRecordId.includes('\\') || trimmedRecordId.length > 50) {
      this.logger?.warn(`Skipping invalid nutrient record ID: ${tableCode}/${trimmedRecordId}`);
      return {};
    }

    return { [tableCode]: trimmedRecordId };
  }

  /**
   * Parse portion size methods from CSV string
   */
  parsePortionSizeMethods(value: string | undefined | null): PortionSizeMethod[] {
    if (!value) {
      return [];
    }

    const methods: PortionSizeMethod[] = [];
    const methodStrings = value.split(/Method:/i).filter(Boolean);

    this.logger?.debug(`Parsing ${methodStrings.length} portion size methods from: "${value.substring(0, 100)}..."`);

    for (const methodStr of methodStrings) {
      const method = this.parsePortionSizeMethod(methodStr.trim());
      if (method) {
        methods.push(method);
        this.logger?.debug(`Successfully parsed ${method.method} method`);
      }
      else {
        this.logger?.warn(`Failed to parse portion method from: "${methodStr.trim()}"`);
      }
    }

    this.logger?.debug(`Total portion methods parsed: ${methods.length}`);
    return methods;
  }

  /**
   * Parse a single portion size method
   */
  parsePortionSizeMethod(methodStr: string): PortionSizeMethod | null {
    try {
      const normalizedInput = methodStr.replace(/\s+/g, ' ').trim();
      if (!normalizedInput.length) {
        return null;
      }

      const commaParts = normalizedInput.split(',').map(p => p.trim()).filter(Boolean);

      let methodName: string;
      let paramSection: string;

      if (commaParts.length > 1) {
        methodName = commaParts[0];
        paramSection = commaParts.slice(1).join(', ');
      }
      else {
        const firstSpace = normalizedInput.indexOf(' ');
        if (firstSpace === -1) {
          methodName = normalizedInput;
          paramSection = '';
        }
        else {
          methodName = normalizedInput.slice(0, firstSpace).trim();
          paramSection = normalizedInput.slice(firstSpace + 1).trim();
        }
      }

      methodName = methodName.toLowerCase();

      const params: Record<string, string> = {};
      const pushParam = (key: string, value: string) => {
        const trimmedValue = value.trim().replace(/,+$/, '');
        if (!trimmedValue) {
          return;
        }
        const normalizedKey = key.replace(/[-\s_]/g, '').toLowerCase();
        params[normalizedKey] = trimmedValue;
        params[key] = trimmedValue;
      };

      if (paramSection.length) {
        // eslint-disable-next-line regexp/no-super-linear-backtracking -- complex regex for parsing method parameters
        const regex = /([\w-]+)\s*:\s*([^:]+?)(?=\s+[\w-]+\s*:|$)/g;
        let match: RegExpExecArray | null;
        // eslint-disable-next-line no-cond-assign -- standard regex exec pattern
        while ((match = regex.exec(paramSection)) !== null) {
          pushParam(match[1], match[2]);
        }

        if (Object.keys(params).length === 0) {
          paramSection.split(',').forEach((part) => {
            const [key, value] = part.split(':').map(p => p.trim());
            if (key && value) {
              pushParam(key, value);
            }
          });
        }
      }

      const conversionFactor = Number.parseFloat(params.conversion || '1.0');

      return this.createPortionMethod(methodName, params, conversionFactor);
    }
    catch (error) {
      this.logger?.error(`Error parsing portion size method: ${error}`);
      return null;
    }
  }

  /**
   * Create a portion size method object from parsed data
   */
  private createPortionMethod(
    methodName: string,
    params: Record<string, string>,
    conversionFactor: number,
  ): PortionSizeMethod | null {
    const getParamValue = (key: string): string | undefined => {
      const normalizedKey = key.replace(/[-\s_]/g, '').toLowerCase();
      return params[key]
        ?? params[normalizedKey]
        ?? params[key.toLowerCase()];
    };

    switch (methodName) {
      case 'as-served':
        return {
          method: 'as-served' as const,
          description: 'use_an_image',
          useForRecipes: false,
          conversionFactor,
          orderBy: '1',
          parameters: {
            servingImageSet: getParamValue('servingImageSet') || 'default',
            leftoversImageSet: getParamValue('leftoversImageSet') || null,
          },
        };

      case 'standard-portion': {
        const units: StandardUnit[] = [];

        if (params.unitscount) {
          const unitCount = Number.parseInt(params.unitscount, 10);
          for (let i = 0; i < unitCount; i++) {
            const unitName = getParamValue(`unit${i}-name`);
            const unitWeight = getParamValue(`unit${i}-weight`);
            const unitOmit = getParamValue(`unit${i}-omit-food-description`);

            if (unitName && unitWeight) {
              units.push({
                name: unitName,
                weight: Number.parseFloat(unitWeight),
                omitFoodDescription: unitOmit === 'true',
              });
            }
          }
        }

        return {
          method: 'standard-portion' as const,
          description: 'use_a_standard_portion',
          useForRecipes: false,
          conversionFactor,
          orderBy: '2',
          parameters: { units },
        };
      }

      case 'cereal':
        return {
          method: 'cereal' as const,
          description: 'cereal',
          useForRecipes: false,
          conversionFactor,
          orderBy: '3',
          parameters: {
            type: (params.type as CerealType) || 'flake',
          },
        };

      case 'drink-scale':
        return {
          method: 'drink-scale' as const,
          description: 'use_a_drink_scale',
          useForRecipes: false,
          conversionFactor,
          orderBy: '4',
          parameters: {
            drinkwareId: getParamValue('drinkwareid') || getParamValue('drinkware-id') || '',
            initialFillLevel: Number.parseFloat(getParamValue('initialfilllevel') || getParamValue('initial-fill-level') || '0.9'),
            skipFillLevel: getParamValue('skipfilllevel') === 'true' || getParamValue('skip-fill-level') === 'true',
          },
        };

      case 'guide-image':
        return {
          method: 'guide-image' as const,
          description: 'use_a_guide_image',
          useForRecipes: false,
          conversionFactor,
          orderBy: '5',
          parameters: {
            guideImageId: getParamValue('guideimageid') || getParamValue('guide-image-id') || '',
          },
        };

      case 'direct-weight':
        return {
          method: 'direct-weight' as const,
          description: 'enter_weight_directly',
          useForRecipes: false,
          conversionFactor,
          orderBy: '6',
          parameters: {},
        };

      case 'milk-in-a-hot-drink': {
        const optionsList: Array<{ label: string; value: number }> = [];
        if (params.options) {
          try {
            const optionPairs = params.options.split(';');
            optionPairs.forEach((pair: string) => {
              const [label, value] = pair.split(':');
              if (label && value) {
                optionsList.push({ label, value: Number.parseFloat(value) });
              }
            });
          }
          catch {
            this.logger?.warn('Failed to parse milk-in-a-hot-drink options');
          }
        }

        return {
          method: 'milk-in-a-hot-drink' as const,
          description: 'milk_in_a_hot_drink',
          useForRecipes: false,
          conversionFactor,
          orderBy: '7',
          parameters: {
            options: { en: optionsList },
          },
        };
      }

      case 'milk-on-cereal':
        return {
          method: 'milk-on-cereal' as const,
          description: 'milk_on_cereal',
          useForRecipes: false,
          conversionFactor,
          orderBy: '8',
          parameters: {},
        };

      case 'parent-food-portion': {
        const optionsList: Array<{ label: string; value: number }> = [];
        if (params.options) {
          try {
            const optionPairs = params.options.split(';');
            optionPairs.forEach((pair: string) => {
              const [label, value] = pair.split(':');
              if (label && value) {
                optionsList.push({ label, value: Number.parseFloat(value) });
              }
            });
          }
          catch {
            this.logger?.warn('Failed to parse parent-food-portion options');
          }
        }

        return {
          method: 'parent-food-portion' as const,
          description: 'parent_food_portion',
          useForRecipes: false,
          conversionFactor,
          orderBy: '9',
          parameters: {
            options: { _default: { en: optionsList } },
          },
        };
      }

      case 'pizza':
        return {
          method: 'pizza' as const,
          description: 'pizza',
          useForRecipes: false,
          conversionFactor,
          orderBy: '10',
          parameters: {},
        };

      case 'pizza-v2':
        return {
          method: 'pizza-v2' as const,
          description: 'pizza_v2',
          useForRecipes: false,
          conversionFactor,
          orderBy: '11',
          parameters: {},
        };

      case 'recipe-builder':
        return {
          method: 'recipe-builder' as const,
          description: 'recipe_builder',
          useForRecipes: false,
          conversionFactor,
          orderBy: '12',
          parameters: {},
        };

      case 'unknown':
        return {
          method: 'unknown' as const,
          description: 'unknown_portion_size',
          useForRecipes: false,
          conversionFactor,
          orderBy: '13',
          parameters: {},
        };

      default:
        this.logger?.warn(`Unrecognized portion size method: ${methodName}`);
        return null;
    }
  }
}

// Export singleton for convenience
export const foodDataParserService = new FoodDataParserService();
