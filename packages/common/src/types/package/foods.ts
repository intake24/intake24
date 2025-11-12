// portion-size.zod.ts
import { z } from 'zod';
import { localeOptionList, localeTranslationStrict } from '../common';

export const pkgV2InheritableAttributes = z.object({
  readyMealOption: z.boolean().optional(),
  sameAsBeforeOption: z.boolean().optional(),
  reasonableAmount: z.number().optional(),
  useInRecipes: z.number().optional(),
});

export const pkgV2PortionSizeMethodTypes = [
  'as-served',
  'guide-image',
  'drink-scale',
  'standard-portion',
  'cereal',
  'milk-on-cereal',
  'pizza',
  'milk-in-a-hot-drink',
  'direct-weight',
  'unknown',
] as const;

export const pkgV2PortionSizeMethodType = z.enum(pkgV2PortionSizeMethodTypes);

export const pkgV2PortionSizeMethodBase = z.object({
  method: pkgV2PortionSizeMethodType,
  description: z.string(),
  useForRecipes: z.boolean(),
  conversionFactor: z.number(),
});

export const pkgV2DirectWeightPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('direct-weight'),
});

export const pkgV2UnknownPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('unknown'),
});

export const pkgV2AsServedPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('as-served'),
  servingImageSet: z.string(),
  leftoversImageSet: z.string().optional(),
  multiple: z.boolean().optional(),
});

export const pkgV2GuideImagePsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('guide-image'),
  guideImageId: z.string(),
});

export const pkgV2DrinkScalePsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('drink-scale'),
  drinkwareId: z.string(),
  initialFillLevel: z.number(),
  skipFillLevel: z.boolean(),
  multiple: z.boolean().optional(),
});

export const pkgV2StandardUnit = z.object({
  name: z.string(),
  weight: z.number(),
  omitFoodDescription: z.boolean(),
  inlineEstimateIn: z.string().optional(),
  inlineHowMany: z.string().optional(),
});

export const pkgV2StandardPortionPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('standard-portion'),
  units: z.array(pkgV2StandardUnit),
});

export const pkgV2CerealPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('cereal'),
  type: z.string(),
});

export const pkgV2PizzaPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('pizza'),
  labels: z.boolean().optional(),
});

export const pkgV2MilkOnCerealPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('milk-on-cereal'),
  labels: z.boolean().optional(),
});

export const pkgV2MilkInHotDrinkPsm = pkgV2PortionSizeMethodBase.extend({
  method: z.literal('milk-in-a-hot-drink'),
  options: localeOptionList({ valueSchema: z.coerce.number() }),
});

export const pkgV2PortionSizeMethod = z.union([
  pkgV2AsServedPsm,
  pkgV2GuideImagePsm,
  pkgV2DrinkScalePsm,
  pkgV2StandardPortionPsm,
  pkgV2CerealPsm,
  pkgV2MilkOnCerealPsm,
  pkgV2PizzaPsm,
  pkgV2MilkInHotDrinkPsm,
  pkgV2DirectWeightPsm,
  pkgV2UnknownPsm,
]);

export const pkgV2AssociatedFood = z.object({
  foodCode: z.string().optional(),
  categoryCode: z.string().optional(),
  promptText: localeTranslationStrict,
  linkAsMain: z.boolean(),
  genericName: localeTranslationStrict,
  multiple: z.boolean().optional(),
});

export const pkgV2Food = z.object({
  code: z.string(),
  version: z.string().optional(),
  name: z.string(),
  englishName: z.string(),
  alternativeNames: z.record(z.array(z.string())).optional(),
  tags: z.array(z.string()).optional(),
  attributes: pkgV2InheritableAttributes,
  parentCategories: z.array(z.string()),
  nutrientTableCodes: z.record(z.string()),
  portionSize: z.array(pkgV2PortionSizeMethod),
  associatedFoods: z.array(pkgV2AssociatedFood),
  brandNames: z.array(z.string()),
  thumbnailPath: z.string().optional(),
});

export type PkgV2InheritableAttributes = z.infer<typeof pkgV2InheritableAttributes>;
export type PkgV2PortionSizeMethodType = z.infer<typeof pkgV2PortionSizeMethodType>;
export type PkgV2PortionSizeMethodBase = z.infer<typeof pkgV2PortionSizeMethodBase>;
export type PkgV2DirectWeightPsm = z.infer<typeof pkgV2DirectWeightPsm>;
export type PkgV2UnknownPsm = z.infer<typeof pkgV2UnknownPsm>;
export type PkgV2AsServedPsm = z.infer<typeof pkgV2AsServedPsm>;
export type PkgV2GuideImagePsm = z.infer<typeof pkgV2GuideImagePsm>;
export type PkgV2DrinkScalePsm = z.infer<typeof pkgV2DrinkScalePsm>;
export type PkgV2StandardUnit = z.infer<typeof pkgV2StandardUnit>;
export type PkgV2StandardPortionPsm = z.infer<typeof pkgV2StandardPortionPsm>;
export type PkgV2CerealPsm = z.infer<typeof pkgV2CerealPsm>;
export type PkgV2PizzaPsm = z.infer<typeof pkgV2PizzaPsm>;
export type PkgV2MilkOnCerealPsm = z.infer<typeof pkgV2MilkOnCerealPsm>;
export type PkgV2MilkInHotDrinkPsm = z.infer<typeof pkgV2MilkInHotDrinkPsm>;
export type PkgV2PortionSizeMethod = z.infer<typeof pkgV2PortionSizeMethod>;
export type PkgV2AssociatedFood = z.infer<typeof pkgV2AssociatedFood>;
export type PkgV2Food = z.infer<typeof pkgV2Food>;
