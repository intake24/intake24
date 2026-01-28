import type { Pagination } from '../generic';
import type { InheritableAttributes } from './attributes';
import type { PortionSizeMethod, PortionSizeParameter } from '@intake24/common/surveys/portion-size';

import { z } from 'zod';

import { portionSizeParameters } from '@intake24/common/surveys/portion-size';

import { inheritableAttributes } from './attributes';
import { categoryPortionSizeMethodAttributes } from './portion-size-methods';

export type CreateCategoryRequest = {
  code: string;
  englishName: string;
  name: string;
  hidden: boolean;
  tags?: string[];
  version?: string;
  attributes: InheritableAttributes;
  parentCategories?: string[];
  portionSizeMethods: PortionSizeMethod[];
};

export type UpdateCategoryRequest = Omit<CreateCategoryRequest, 'code' | 'version'>;

export const categoryAttributes = z.object({
  id: z.string(),
  code: z.string().min(1).max(64),
  localeId: z.string().min(1).max(64),
  englishName: z.string().min(1).max(256),
  name: z.string().min(1).max(256),
  simpleName: z.string().nullish(),
  hidden: z.boolean(),
  tags: z.string().array(),
  version: z.string().uuid(),
});
export type CategoryAttributes = z.infer<typeof categoryAttributes>;

export const categoryEntry = categoryAttributes.extend({
  get parentCategories() {
    return categoryAttributes.array().optional();
  },
  attributes: inheritableAttributes.optional(),
  portionSizeMethods: categoryPortionSizeMethodAttributes.array().optional(),
});
export type CategoryEntry = z.infer<typeof categoryEntry>;

export const categoryInput = categoryAttributes.omit({
  id: true,
  localeId: true,
  simpleName: true,
}).partial({
  tags: true,
  version: true,
}).extend({
  attributes: inheritableAttributes.optional(),
  parentCategories: categoryAttributes.pick({ id: true }).array().optional(),
  portionSizeMethods: categoryPortionSizeMethodAttributes
    .partial({ id: true, categoryId: true })
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
export type CategoryInput = z.infer<typeof categoryInput>;

export const categoryCopyInput = categoryAttributes.pick({
  code: true,
  name: true,
  englishName: true,
});
export type CategoryCopyInput = z.infer<typeof categoryCopyInput>;

export const categoryListEntry = categoryAttributes.pick({
  id: true,
  code: true,
  localeId: true,
  name: true,
  englishName: true,
  hidden: true,
});
export type CategoryListEntry = z.infer<typeof categoryListEntry>;

export type CategoriesResponse = Pagination<CategoryListEntry>;

export type SimpleCategoryEntry = {
  id: string;
  code: string;
  localeId: string;
  version: string;
  name: string;
  portionSizeMethods: PortionSizeMethod[];
};
