import type { LocaleTranslations } from '../../common';
import type { Pagination } from '../generic';
import type { AssociatedFood } from './associated-food';
import type { InheritableAttributes } from './attributes';
import type { PortionSizeMethod, PortionSizeParameter } from '@intake24/common/surveys/portion-size';

import { z } from 'zod';

import { portionSizeParameters } from '@intake24/common/surveys/portion-size';

import { localeTranslations } from '../../common';
import { associatedFoodAttributes } from './associated-food';
import { inheritableAttributes } from './attributes';
import { categoryAttributes } from './categories';
import { nutrientTableRecordAttributes } from './nutrient-tables';
import { foodPortionSizeMethodAttributes, portionSizeMethodAttributes } from './portion-size-methods';

export type CreateFoodRequest = {
  code: string;
  englishName: string;
  name: string;
  altNames?: LocaleTranslations;
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
  altNames: localeTranslations,
  tags: z.string().array(),
  version: z.uuid(),
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

export const bulkFoodInput = foodAttributes.omit({
  id: true,
  localeId: true,
  simpleName: true,
}).partial({
  altNames: true,
  tags: true,
  version: true,
}).extend({
  attributes: inheritableAttributes,
  associatedFoods: associatedFoodAttributes.omit({ id: true, foodId: true }).array(),
  nutrientRecords: nutrientTableRecordAttributes.pick({ nutrientTableId: true, nutrientTableRecordId: true }).array(),
  parentCategories: categoryAttributes.shape.code.array(),
  portionSizeMethods: portionSizeMethodAttributes.omit({ id: true }).array(),
});
export type BulkFoodInput = z.infer<typeof bulkFoodInput>;

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
