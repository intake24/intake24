import { z } from 'zod';

import { categoryLocaleOptionList, localeOptionList } from '../types/common';

export const portionSizeMethods = [
  'as-served',
  'cereal',
  'direct-weight',
  'drink-scale',
  'guide-image',
  'milk-in-a-hot-drink',
  'milk-on-cereal',
  'parent-food-portion',
  'pizza',
  'pizza-v2',
  'recipe-builder',
  'standard-portion',
  'unknown',
] as const;

export type PortionSizeMethodId = (typeof portionSizeMethods)[number];

export const cerealTypes = ['hoop', 'flake', 'rkris'] as const;
export type CerealType = (typeof cerealTypes)[number];

export const standardUnit = z.object({
  name: z.string(),
  weight: z.coerce.number(),
  omitFoodDescription: z.boolean(),
  inlineHowMany: z.string().optional(),
  inlineEstimateIn: z.string().optional(),
});

export type StandardUnit = z.infer<typeof standardUnit>;

export const asServedPortionSizeParameters = z.object({
  servingImageSet: z.string(),
  leftoversImageSet: z.string().nullish(),
  labels: z.boolean().optional(),
  multiple: z.boolean().optional(),
});

export const cerealPortionSizeParameters = z.object({
  type: z.enum(cerealTypes),
  labels: z.boolean().optional(),
});

export const directWeightPortionSizeParameters = z.object({});

export const drinkScalePortionSizeParameters = z.object({
  drinkwareId: z.string(),
  initialFillLevel: z.coerce.number(),
  skipFillLevel: z.boolean(),
  labels: z.boolean().optional(),
  multiple: z.boolean().optional(),
});

export const guideImagePortionSizeParameters = z.object({
  guideImageId: z.string(),
  labels: z.boolean().optional(),
});

export const milkInHotDrinkPortionSizeParameters = z.object({
  options: localeOptionList({ valueSchema: z.coerce.number() }),
});

export const milkOnCerealPortionSizeParameters = z.object({
  labels: z.boolean().optional(),
});

export const parentFoodPortionParameters = z.object({
  options: categoryLocaleOptionList(z.coerce.number()),
});

export const pizzaPortionSizeParameters = z.object({
  labels: z.boolean().optional(),
});

export const pizzaV2PortionSizeParameters = z.object({
  labels: z.boolean().optional(),
});

export const recipeBuilderPortionSizeParameters = z.object({});

export const standardPortionSizeParameters = z.object({
  units: standardUnit.array(),
});

export const unknownPortionSizeParameters = z.object({});

export const portionSizeParameter = z.union([
  asServedPortionSizeParameters,
  cerealPortionSizeParameters,
  directWeightPortionSizeParameters,
  drinkScalePortionSizeParameters,
  guideImagePortionSizeParameters,
  milkInHotDrinkPortionSizeParameters,
  milkOnCerealPortionSizeParameters,
  parentFoodPortionParameters,
  pizzaPortionSizeParameters,
  pizzaV2PortionSizeParameters,
  recipeBuilderPortionSizeParameters,
  standardPortionSizeParameters,
  unknownPortionSizeParameters,
]);

export type PortionSizeParameter = z.infer<typeof portionSizeParameter>;

export const portionSizeParameters = z.object({
  'as-served': asServedPortionSizeParameters,
  cereal: cerealPortionSizeParameters,
  'direct-weight': directWeightPortionSizeParameters,
  'drink-scale': drinkScalePortionSizeParameters,
  'guide-image': guideImagePortionSizeParameters,
  'milk-in-a-hot-drink': milkInHotDrinkPortionSizeParameters,
  'milk-on-cereal': milkOnCerealPortionSizeParameters,
  'parent-food-portion': parentFoodPortionParameters,
  pizza: pizzaPortionSizeParameters,
  'pizza-v2': pizzaV2PortionSizeParameters,
  'recipe-builder': recipeBuilderPortionSizeParameters,
  'standard-portion': standardPortionSizeParameters,
  unknown: unknownPortionSizeParameters,
});

export type PortionSizeParameters = z.infer<typeof portionSizeParameters>;

export const portionSizeMethodBase = z.object({
  description: z.string().min(1).max(256),
  useForRecipes: z.boolean(),
  conversionFactor: z.number(),
  orderBy: z.string(),
});
export type PortionSizeMethodBase = z.infer<typeof portionSizeMethodBase>;

export interface AsServedPsm extends PortionSizeMethodBase {
  method: 'as-served';
  parameters: PortionSizeParameters['as-served'];
}

export interface CerealPsm extends PortionSizeMethodBase {
  method: 'cereal';
  parameters: PortionSizeParameters['cereal'];
}

export interface DirectWeightPsm extends PortionSizeMethodBase {
  method: 'direct-weight';
  parameters: PortionSizeParameters['direct-weight'];
}

export interface DrinkScalePsm extends PortionSizeMethodBase {
  method: 'drink-scale';
  parameters: PortionSizeParameters['drink-scale'];
}

export interface GuideImagePsm extends PortionSizeMethodBase {
  method: 'guide-image';
  parameters: PortionSizeParameters['guide-image'];
}

export interface MilkInHotDrinkPsm extends PortionSizeMethodBase {
  method: 'milk-in-a-hot-drink';
  parameters: PortionSizeParameters['milk-in-a-hot-drink'];
}
export interface MilkOnCerealPsm extends PortionSizeMethodBase {
  method: 'milk-on-cereal';
  parameters: PortionSizeParameters['milk-on-cereal'];
}

export interface ParentFoodPsm extends PortionSizeMethodBase {
  method: 'parent-food-portion';
  parameters: PortionSizeParameters['parent-food-portion'];
}

export interface PizzaPsm extends PortionSizeMethodBase {
  method: 'pizza';
  parameters: PortionSizeParameters['pizza'];
}

export interface PizzaV2Psm extends PortionSizeMethodBase {
  method: 'pizza-v2';
  parameters: PortionSizeParameters['pizza-v2'];
}

export interface RecipeBuilderPsm extends PortionSizeMethodBase {
  method: 'recipe-builder';
  parameters: PortionSizeParameters['recipe-builder'];
}

export interface StandardPortionPsm extends PortionSizeMethodBase {
  method: 'standard-portion';
  parameters: PortionSizeParameters['standard-portion'];
}

export interface UnknownPortionPsm extends PortionSizeMethodBase {
  method: 'unknown';
  parameters: PortionSizeParameters['unknown'];
}

export type PortionSizeMethod
  = | AsServedPsm
    | CerealPsm
    | DirectWeightPsm
    | DrinkScalePsm
    | GuideImagePsm
    | MilkInHotDrinkPsm
    | MilkOnCerealPsm
    | ParentFoodPsm
    | PizzaPsm
    | PizzaV2Psm
    | RecipeBuilderPsm
    | StandardPortionPsm
    | UnknownPortionPsm;

export const pizzaSizes = ['personal', 'small', 'medium', 'large', 'xxl'] as const;
export type PizzaSize = (typeof pizzaSizes)[number];
export const pizzaCrusts = ['classic', 'italian-thin', 'stuffed'] as const;
export type PizzaCrust = (typeof pizzaCrusts)[number];

export const pizzaUnits = ['slice', 'whole'] as const;
export type PizzaUnit = (typeof pizzaUnits)[number];

// Portion size states
const portionSizeStateBase = z.object({
  servingWeight: z.number().nullable(),
  leftoversWeight: z.number().nullable(),
});

const selectedAsServedImage = z.object({
  asServedSetId: z.string(),
  imageUrl: z.string(),
  index: z.number(),
  weight: z.number(),
});
export type SelectedAsServedImage = z.infer<typeof selectedAsServedImage>;

const asServedPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('as-served'),
  serving: selectedAsServedImage.nullable(),
  leftovers: selectedAsServedImage.nullable(),
  quantity: z.number(),
  linkedQuantity: z.number(),
});

const cerealPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('cereal'),
  imageUrl: z.string().nullable(),
  type: z.enum(cerealTypes),
  bowl: z.string().nullable(),
  bowlId: z.string().optional(),
  bowlIndex: z.number().optional(),
  serving: selectedAsServedImage.nullable(),
  leftovers: selectedAsServedImage.nullable(),
});
const directWeightPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('direct-weight'),
  quantity: z.number().nullable(),
});
const drinkScalePortionSizeState = portionSizeStateBase.extend({
  method: z.literal('drink-scale'),
  drinkwareId: z.string(),
  initialFillLevel: z.number(),
  skipFillLevel: z.boolean(),
  imageUrl: z.string(),
  containerId: z.string().optional(),
  containerIndex: z.number().optional(),
  fillLevel: z.number(),
  leftoversLevel: z.number(),
  leftovers: z.boolean(),
  quantity: z.number(),
});
const guideImagePortionSizeState = portionSizeStateBase.extend({
  method: z.literal('guide-image'),
  guideImageId: z.string(),
  imageUrl: z.string().nullable(),
  objectId: z.string().optional(),
  objectIndex: z.number().optional(),
  objectWeight: z.number(),
  quantity: z.number(),
  linkedQuantity: z.number(),
});
const milkInHotDrinkPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('milk-in-a-hot-drink'),
  milkPartIndex: z.number().nullable(),
  milkVolumePercentage: z.number().nullable(),
});
const milkOnCerealPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('milk-on-cereal'),
  imageUrl: z.string().nullable(),
  bowl: z.string().nullable(),
  bowlId: z.string().optional(),
  bowlIndex: z.number().optional(),
  milkLevelId: z.string().optional(),
  milkLevelIndex: z.number().optional(),
  milkLevelImage: z.string().nullable(),
});
const parentFoodPortionPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('parent-food-portion'),
  portionIndex: z.number().nullable(),
  portionValue: z.number().nullable(),
});
const pizzaPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('pizza'),
  type: z.object({
    id: z.string().optional(),
    index: z.number().optional(),
    image: z.string().nullable(),
  }),
  thickness: z.object({
    id: z.string().optional(),
    index: z.number().optional(),
    image: z.string().nullable(),
  }),
  slice: z.object({
    id: z.string().optional(),
    index: z.number().optional(),
    image: z.string().nullable(),
    quantity: z.number(),
  }),
});
const pizzaV2PortionSizeState = portionSizeStateBase.extend({
  method: z.literal('pizza-v2'),
  size: z.enum(pizzaSizes).nullable(),
  crust: z.enum(pizzaCrusts).nullable(),
  unit: z.enum(pizzaUnits).nullable(),
  quantity: z.number(),
});
const recipeBuilderPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('recipe-builder'),
});
const standardPortionPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('standard-portion'),
  unit: standardUnit.nullable(),
  quantity: z.number(),
  linkedQuantity: z.number(),
});
const unknownPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('unknown'),
});

export const portionSizeStates = z.object({
  'as-served': asServedPortionSizeState,
  cereal: cerealPortionSizeState,
  'direct-weight': directWeightPortionSizeState,
  'drink-scale': drinkScalePortionSizeState,
  'guide-image': guideImagePortionSizeState,
  'milk-in-a-hot-drink': milkInHotDrinkPortionSizeState,
  'milk-on-cereal': milkOnCerealPortionSizeState,
  'parent-food-portion': parentFoodPortionPortionSizeState,
  pizza: pizzaPortionSizeState,
  'pizza-v2': pizzaV2PortionSizeState,
  'recipe-builder': recipeBuilderPortionSizeState,
  'standard-portion': standardPortionPortionSizeState,
  unknown: unknownPortionSizeState,
});
export type PortionSizeStates = z.infer<typeof portionSizeStates>;
export type PortionSizeState = PortionSizeStates[keyof PortionSizeStates];
export type GetPortionSizeState<P extends keyof PortionSizeStates> = PortionSizeStates[P];
