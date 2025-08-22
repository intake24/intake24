import { Category, Food } from '@intake24/db';

export interface CodeLookupResult {
  code: string;
  type: 'food' | 'category' | 'unknown';
  exists: boolean;
  name?: string;
}

export class FoodOrCategoryLookupService {
  /**
   * Determines if a given code is a food or category by checking the database
   * @param code The code to check
   * @returns Information about the code including its type and existence
   */
  async lookupCode(code: string): Promise<CodeLookupResult> {
    if (!code || typeof code !== 'string') {
      return { code, type: 'unknown', exists: false };
    }

    // Check if it's a food code
    const food = await Food.findOne({
      where: { code },
      attributes: ['code', 'name'],
    });

    if (food) {
      return {
        code,
        type: 'food',
        exists: true,
        name: food.name,
      };
    }

    // Check if it's a category code
    const category = await Category.findOne({
      where: { code },
      attributes: ['code', 'name'],
    });

    if (category) {
      return {
        code,
        type: 'category',
        exists: true,
        name: category.name,
      };
    }

    // Not found in either table
    return {
      code,
      type: 'unknown',
      exists: false,
    };
  }

  /**
   * Batch lookup for multiple codes
   * @param codes Array of codes to check
   * @returns Map of code to lookup result
   */
  async lookupCodes(codes: string[]): Promise<Map<string, CodeLookupResult>> {
    const results = new Map<string, CodeLookupResult>();

    if (!codes || codes.length === 0) {
      return results;
    }

    // Batch query for foods
    const foods = await Food.findAll({
      where: { code: codes },
      attributes: ['code', 'name'],
    });

    const foodCodes = new Set(foods.map(f => f.code));
    foods.forEach((food) => {
      results.set(food.code, {
        code: food.code,
        type: 'food',
        exists: true,
        name: food.name,
      });
    });

    // Batch query for categories (only for codes not found as foods)
    const remainingCodes = codes.filter(code => !foodCodes.has(code));
    if (remainingCodes.length > 0) {
      const categories = await Category.findAll({
        where: { code: remainingCodes },
        attributes: ['code', 'name'],
      });

      categories.forEach((category) => {
        results.set(category.code, {
          code: category.code,
          type: 'category',
          exists: true,
          name: category.name,
        });
      });

      // Mark remaining codes as unknown
      remainingCodes.forEach((code) => {
        if (!results.has(code)) {
          results.set(code, {
            code,
            type: 'unknown',
            exists: false,
          });
        }
      });
    }

    return results;
  }

  /**
   * Check if a code exists as either a food or category
   * @param code The code to check
   * @returns True if the code exists in either table
   */
  async codeExists(code: string): Promise<boolean> {
    const result = await this.lookupCode(code);
    return result.exists;
  }

  /**
   * Get the type of a code (food, category, or unknown)
   * @param code The code to check
   * @returns The type of the code
   */
  async getCodeType(code: string): Promise<'food' | 'category' | 'unknown'> {
    const result = await this.lookupCode(code);
    return result.type;
  }
}

export default FoodOrCategoryLookupService;
export const foodOrCategoryLookupService = new FoodOrCategoryLookupService();
