import type { CategoryData, FoodData } from '@intake24/api/food-index/workers/food-data';
import type Logger from '@intake24/common-backend/services/logger/logger';

interface TransitiveParentCategory {
  transitiveLevel: number;
  categoryData: CategoryData;
}

export class ParentCategoryIndex {
  private readonly logger: typeof Logger;
  private readonly foodParentCategories: Map<string, Map<string, CategoryData>>;
  private readonly categoryParentCategories: Map<string, Map<string, CategoryData>>;
  private readonly categoryData: Map<string, CategoryData>;
  private readonly foodTransitiveParentCategories: Map<string, Map<string, TransitiveParentCategory>>;
  private readonly categoryTransitiveParentCategories: Map<string, Map<string, TransitiveParentCategory>>;

  public readonly nonEmptyCategories: Set<string>;

  private addTransitiveParentCategories(categories: Map<string, CategoryData>): Map<string, TransitiveParentCategory> {
    const transitiveParentCategories = new Map<string, TransitiveParentCategory>();

    let currentSet = categories;
    let transitiveLevel = 0;

    while (currentSet.size > 0) {
      for (const [code, categoryData] of currentSet)
        transitiveParentCategories.set(code, { transitiveLevel, categoryData });

      const nextSet = new Map<string, CategoryData>();

      for (const code of currentSet.keys()) {
        const parentCategories = this.categoryParentCategories.get(code);
        if (parentCategories === undefined) {
          this.logger.warn(`Category ${code} is used as a parent, but has no local data`);
        }
        else {
          for (const [parentCode, parentData] of parentCategories)
            nextSet.set(parentCode, parentData);
        }
      }

      currentSet = nextSet;
      ++transitiveLevel;
    }

    return transitiveParentCategories;
  }

  private attachCategoryData(categories: Set<string>): Map<string, CategoryData> {
    const result = new Map<string, CategoryData>();

    for (const categoryCode of categories) {
      const data = this.categoryData.get(categoryCode);
      if (data === undefined)
        this.logger.warn(`Category ${categoryCode} is used as a parent, but has no local data`);
      else
        result.set(categoryCode, data);
    }

    return result;
  }

  public isFoodInCategory(foodCode: string, categoryCode: string): boolean {
    const parentCategories = this.foodTransitiveParentCategories.get(foodCode);

    if (parentCategories === undefined)
      return false;

    return parentCategories.has(categoryCode);
  }

  public isSubCategory(categoryCode: string, parentCategoryCode: string): boolean {
    const parentCategories = this.categoryTransitiveParentCategories.get(categoryCode);

    if (parentCategories === undefined)
      return false;

    return parentCategories.has(parentCategoryCode);
  }

  public getFoodTransitiveParentCategories(foodCode: string, transitiveLimit?: number): Map<string, CategoryData> {
    const result = new Map<string, CategoryData>();
    const parentCategories = this.foodTransitiveParentCategories.get(foodCode);
    if (parentCategories !== undefined) {
      for (const [categoryCode, category] of parentCategories) {
        if (transitiveLimit === undefined || category.transitiveLevel <= transitiveLimit)
          result.set(categoryCode, category.categoryData);
      }
    }
    return result;
  }

  // Some categories can have a local record (that is, a row in category_locals) but no local foods
  // having that category as parent, directly or transitively.
  //
  // Such categories must be omitted from search results.
  private getNonEmptyCategories(foods: FoodData[]): Set<string> {
    const nonEmptyCategories = new Set<string>();

    for (const food of foods) {
      const parentCategories = this.foodTransitiveParentCategories.get(food.code);

      if (parentCategories !== undefined) {
        for (const parentCategoryCode of parentCategories.keys())
          nonEmptyCategories.add(parentCategoryCode);
      }
    }

    return nonEmptyCategories;
  }

  public isCategoryHidden(categoryCode: string): boolean {
    const categoryData = this.categoryData.get(categoryCode);
    if (categoryData === undefined) {
      this.logger.error(`No category data for ${categoryCode}!`);
      return false;
    }
    return categoryData.hidden;
  }

  public isFoodHidden(foodCode: string): boolean {
    const parentCategories = this.foodParentCategories.get(foodCode);

    if (parentCategories === undefined) {
      this.logger.error(`No parent category data for ${foodCode}!`);
      return false;
    }

    if (parentCategories.size === 0) {
      this.logger.warn(`${foodCode} is not assigned to any category`);
      return false;
    }

    for (const categoryCode of parentCategories.keys()) {
      if (!this.isCategoryHidden(categoryCode))
        return false;
    }

    return true;
  }

  constructor(foods: FoodData[], categories: CategoryData[], logger: typeof Logger) {
    this.logger = logger;
    this.categoryData = new Map(categories.map(data => [data.code, data]));
    this.foodParentCategories = new Map(foods.map(food => [food.code, this.attachCategoryData(food.parentCategories)]));
    this.categoryParentCategories = new Map(categories.map(category => [category.code, this.attachCategoryData(category.parentCategories)]));
    this.foodTransitiveParentCategories = new Map(foods.map(food => [food.code, this.addTransitiveParentCategories(this.foodParentCategories.get(food.code)!)]));
    this.categoryTransitiveParentCategories = new Map(categories.map(category => [category.code, this.addTransitiveParentCategories(this.categoryParentCategories.get(category.code)!)]));
    this.nonEmptyCategories = this.getNonEmptyCategories(foods);
  }
}
