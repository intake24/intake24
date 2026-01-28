import type { Pagination } from '../generic';
import type { AssociatedFood } from './associated-food';
import type { InheritableAttributes } from './attributes';
import type { PortionSizeMethod, PortionSizeParameter } from '@intake24/common/surveys/portion-size';

import { z } from 'zod';

import { portionSizeParameters } from '@intake24/common/surveys/portion-size';

import { associatedFoodAttributes } from './associated-food';
import { inheritableAttributes } from './attributes';
import { categoryAttributes } from './categories';
import { nutrientTableRecordAttributes } from './nutrient-tables';
import { foodPortionSizeMethodAttributes } from './portion-size-methods';

export const altNames = z.record(z.string(), z.string().array());
export type AltNames = z.infer<typeof altNames>;

export type CreateFoodRequest = {
  code: string;
  englishName: string;
  name: string;
  altNames?: AltNames;
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
  altNames,
  tags: z.string().array(),
  version: z.string().uuid(),
});
export type FoodAttributes = z.infer<typeof foodAttributes>;

export const foodEntry = foodAttributes.extend({
  associatedFoods: associatedFoodAttributes.array().optional(),
  attributes: inheritableAttributes.optional(),
  parentCategories: categoryAttributes.array().optional(),
  portionSizeMethods: foodPortionSizeMethodAttributes.array().optional(),
  nutrientRecords: nutrientTableRecordAttributes.array().optional(),
});
export type FoodEntry = z.infer<typeof foodEntry>;

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
  portionSizeMethods: foodPortionSizeMethodAttributes
    .partial({ id: true, foodId: true })
    .omit({ parameters: true })
    .extend({
      parameters: z.custom<PortionSizeParameter>(() => {
        return true;
      }),
    })
    .superRefine(
      ({ method, parameters }, ctx) => {
        const { success, error } = portionSizeParameters.shape[method].safeParse(parameters);
        if (!success) {
          error.issues.forEach((issue) => {
            issue.path.unshift('parameters');
            ctx.addIssue({ ...issue });
          });
        }
      },
    )
    .array()
    .optional(),
});
export type FoodInput = z.infer<typeof foodInput>;

export const foodCopyInput = foodAttributes.pick({
  localeId: true,
  code: true,
  englishName: true,
  name: true,
});
export type FoodCopyInput = z.infer<typeof foodCopyInput>;

export const foodListEntry = foodAttributes.pick({
  id: true,
  code: true,
  localeId: true,
  name: true,
  englishName: true,
});
export type FoodListEntry = z.infer<typeof foodListEntry>;

export type FoodsResponse = Pagination<FoodListEntry>;
