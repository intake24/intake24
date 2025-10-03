import type { Nullable } from '../../common';
import type { Pagination } from '../generic';
import type { AssociatedFood, AssociatedFoodAttributes } from './associated-food';
import type { InheritableAttributes } from './attributes';
import type { CategoryAttributes } from './categories';
import type { NutrientTableRecordAttributes } from './nutrient-tables';
import type { FoodPortionSizeMethodAttributes } from './portion-size-methods';
import { z } from 'zod';
import type { PortionSizeMethod } from '@intake24/common/surveys/portion-size';
import { associatedFoodAttributes } from './associated-food';
import { inheritableAttributes } from './attributes';
import { categoryAttributes } from './categories';
import { nutrientTableRecordAttributes } from './nutrient-tables';
import { foodPortionSizeMethodAttributes } from './portion-size-methods';

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

export const foodInput = foodAttributes.omit({
  id: true,
  localeId: true,
  simpleName: true,
}).partial({
  altNames: true,
  tags: true,
  version: true,
}).extend({
  attributes: inheritableAttributes.optional(),
  associatedFoods: associatedFoodAttributes.array().optional(),
  nutrientRecords: nutrientTableRecordAttributes.pick({ id: true }).array().optional(),
  parentCategories: categoryAttributes.pick({ id: true }).array().optional(),
  portionSizeMethods: foodPortionSizeMethodAttributes.partial({ id: true, foodId: true }).array().optional(),
});
export type FoodInput = z.infer<typeof foodInput>;

export type FoodCopyInput = {
  localeId: string;
  code: string;
  englishName: string;
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
  portionSizeMethods?: FoodPortionSizeMethodAttributes[];
  nutrientRecords?: NutrientTableRecordAttributes[];
}
