import type { Nullable } from '../../common';
import type { Pagination } from '../generic';
import type { AssociatedFood } from './associated-food';
import type { CategoryAttributes } from './categories';
import type { PortionSizeMethodAttributes } from './portion-size-methods';
import { z } from 'zod';
import type { PortionSizeMethod } from '@intake24/common/surveys/portion-size';
import type {
  AssociatedFoodAttributes,
  AssociatedFoodCreationAttributes,
  FoodPortionSizeMethodAttributes,
  FoodsLocaleAttributes,
  NutrientTableRecordAttributes,
} from '@intake24/db';

export const inheritableAttributes = z.object({
  readyMealOption: z.boolean().optional(),
  sameAsBeforeOption: z.boolean().optional(),
  reasonableAmount: z.number().optional(),
  useInRecipes: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
});
export type InheritableAttributes = z.infer<typeof inheritableAttributes>;

export type CreateFoodRequest = {
  code: string;
  englishName: string;
  name: string;
  altNames?: Record<string, string[]>;
  tags?: string[];
  attributes: InheritableAttributes;
  parentCategories?: string[];
  nutrientTableCodes: Record<string, string>;
  portionSizeMethods: PortionSizeMethod[];
  associatedFoods: AssociatedFood[];
};

export type CreateFoodRequestOptions = {
  update: boolean;
  return: boolean;
};

export const foodAttributes = z.object({
  id: z.string(),
  code: z.string().min(1).max(64),
  localeId: z.string().min(1).max(64),
  englishName: z.string().min(1).max(256),
  name: z.string().min(1).max(256).nullable(),
  simpleName: z.string().nullable(),
  altNames: z.record(z.string().array()),
  tags: z.string().array(),
  version: z.string().uuid(),
});
export type FoodAttributes = z.infer<typeof foodAttributes>;

export type FoodInput = {
  code: string;
  name: string;
  englishName: string;
  parentCategories?: CategoryAttributes[];
  altNames?: Record<string, string[]>;
  tags?: string[];
  attributes?: Nullable<InheritableAttributes>;
  associatedFoods: AssociatedFoodCreationAttributes[];
  nutrientRecords: NutrientTableRecordAttributes[];
  portionSizeMethods: PortionSizeMethodAttributes[];
};

export type FoodCopyInput = {
  localeId: string;
  code: string;
  name: string;
};

export const foodListEntry = foodAttributes.pick({
  id: true,
  code: true,
  localeId: true,
  name: true,
  englishName: true,
});
export type FoodListEntry = z.infer<typeof foodListEntry>;

export type FoodsResponse = Pagination<FoodListEntry>;

export interface FoodEntry extends FoodAttributes {
  associatedFoods?: AssociatedFoodAttributes[];
  attributes?: Nullable<InheritableAttributes>;
  parentCategories?: CategoryAttributes[];
  locales?: FoodsLocaleAttributes[];
  portionSizeMethods?: FoodPortionSizeMethodAttributes[];
  nutrientRecords?: NutrientTableRecordAttributes[];
}
