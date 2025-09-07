import type { Pagination } from '../generic';
import type { AssociatedFood } from './associated-food';
import type { PortionSizeMethod } from '@intake24/common/surveys/portion-size';
import type { UseInRecipeType } from '@intake24/common/types';

import type {
  AssociatedFoodAttributes,
  AssociatedFoodCreationAttributes,
  CategoryAttributes,
  FoodAttributeAttributes,
  FoodAttributes,
  FoodLocalAttributes,
  FoodPortionSizeMethodAttributes,
  FoodPortionSizeMethodCreationAttributes,
  FoodsLocaleAttributes,
  NutrientTableRecordAttributes,
} from '@intake24/db';

export type InheritableAttributes = {
  readyMealOption?: boolean;
  sameAsBeforeOption?: boolean;
  reasonableAmount?: number;
  useInRecipes?: UseInRecipeType;
};

export type CreateGlobalFoodRequest = {
  code: string;
  name: string;
  attributes: InheritableAttributes;
  foodGroupId?: number;
  parentCategories?: string[];
};

export type UpdateGlobalFoodRequest = Omit<CreateGlobalFoodRequest, 'code'>;

export type CreateLocalFoodRequest = {
  code: string;
  name: string;
  altNames?: Record<string, string[]>;
  tags?: string[];
  nutrientTableCodes: Record<string, string>;
  portionSizeMethods: PortionSizeMethod[];
  associatedFoods: AssociatedFood[];
};

export type CreateLocalFoodRequestOptions = {
  update: boolean;
  return: boolean;
};

export type UpdateLocalFoodRequest = Omit<CreateLocalFoodRequest, 'code'>;

export type CreateGlobalCategoryRequest = {
  code: string;
  version?: string;
  name: string;
  isHidden: boolean;
  attributes: InheritableAttributes;
  parentCategories?: string[];
};

export type UpdateGlobalCategoryRequest = Omit<CreateGlobalCategoryRequest, 'code' | 'version'>;

export type GlobalCategoryEntry = {
  code: string;
  version: string;
  name: string;
  isHidden: boolean;
  attributes: InheritableAttributes;
  parentCategories: string[];
};

export type CreateLocalCategoryRequest = {
  code: string;
  version?: string;
  name: string;
  portionSizeMethods: PortionSizeMethod[];
  tags?: string[];
};

export type UpdateLocalCategoryRequest = Omit<CreateLocalCategoryRequest, 'code' | 'version'>;

export type LocalCategoryEntry = {
  id: string;
  categoryCode: string;
  localeId: string;
  version: string;
  name: string;
  portionSizeMethods: PortionSizeMethod[];
};

export type FoodInput = Pick<FoodAttributes, 'code' | 'name'> & {
  parentCategories?: Pick<CategoryAttributes, 'code' | 'name'>[];
};

export type FoodLocalInput = {
  name: string;
  main?: {
    code?: string;
    name?: string;
    attributes?: FoodAttributeAttributes;
    locales?: FoodsLocaleAttributes[];
    parentCategories?: Pick<CategoryAttributes, 'code' | 'name'>[];
  };
  altNames?: Record<string, string[]>;
  tags?: string[];
  nutrientRecords: Pick<NutrientTableRecordAttributes, 'id'>[];
  portionSizeMethods: FoodPortionSizeMethodCreationAttributes[];
  associatedFoods: AssociatedFoodCreationAttributes[];
};

export type FoodLocalCopySource = {
  foodId: string;
  localeId: string;
  localeCode: string;
};

export type FoodLocalCopyInput = {
  localeId: string;
  code: string;
  name: string;
};

export type FoodListEntry = {
  id: string;
  code: string;
  localeId: string;
  name: string;
  englishName: string;
};

export type FoodsResponse = Pagination<FoodListEntry>;

export type FoodEntry = FoodAttributes & {
  attributes?: FoodAttributeAttributes;
  parentCategories?: CategoryAttributes[];
  locales?: FoodsLocaleAttributes[];
};

export interface FoodLocalEntry extends FoodLocalAttributes {
  main?: FoodEntry;
  associatedFoods?: AssociatedFoodAttributes[];
  portionSizeMethods?: FoodPortionSizeMethodAttributes[];
  nutrientRecords?: NutrientTableRecordAttributes[];
}
