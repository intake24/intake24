import { z } from 'zod';

import { categoryLocaleOptionList, localeOptionList } from '../types/common';

export const portionSizeMethods = [
  'as-served',
  'auto',
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

export const pathways = ['addon', 'afp', 'recipe', 'search'] as const;
export type Pathway = (typeof pathways)[number];

export const pathwaysSchema = z.enum(pathways).array();
export type Pathways = z.infer<typeof pathwaysSchema>;

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

export const autoPsmModes = ['weight', 'weight-per-100g-parent'] as const;
export type AutoPsmMode = (typeof autoPsmModes)[number];

export const autoPortionSizeParameters = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('weight'),
    value: z.number(),
  }),
  z.object({
    mode: z.literal('weight-per-100g-parent'),
    value: z.number(),
  }),
]);
export type AutoPortionSizeParameters = z.infer<typeof autoPortionSizeParameters>;

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
  autoPortionSizeParameters,
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
  auto: autoPortionSizeParameters,
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
  pathways: z.enum(pathways).array(),
  conversionFactor: z.number(),
  orderBy: z.string(),
});
export type PortionSizeMethodBase = z.infer<typeof portionSizeMethodBase>;

export const asServedPsm = portionSizeMethodBase.extend({
  method: z.literal('as-served'),
  parameters: asServedPortionSizeParameters,
});
export type AsServedPsm = z.infer<typeof asServedPsm>;

export const autoPsm = portionSizeMethodBase.extend({
  method: z.literal('auto'),
  parameters: autoPortionSizeParameters,
});
export type AutoPsm = z.infer<typeof autoPsm>;

export const cerealPsm = portionSizeMethodBase.extend({
  method: z.literal('cereal'),
  parameters: cerealPortionSizeParameters,
});
export type CerealPsm = z.infer<typeof cerealPsm>;

export const directWeightPsm = portionSizeMethodBase.extend({
  method: z.literal('direct-weight'),
  parameters: directWeightPortionSizeParameters,
});
export type DirectWeightPsm = z.infer<typeof directWeightPsm>;

export const drinkScalePsm = portionSizeMethodBase.extend({
  method: z.literal('drink-scale'),
  parameters: drinkScalePortionSizeParameters,
});
export type DrinkScalePsm = z.infer<typeof drinkScalePsm>;

export const guideImagePsm = portionSizeMethodBase.extend({
  method: z.literal('guide-image'),
  parameters: guideImagePortionSizeParameters,
});
export type GuideImagePsm = z.infer<typeof guideImagePsm>;

export const milkInHotDrinkPsm = portionSizeMethodBase.extend({
  method: z.literal('milk-in-a-hot-drink'),
  parameters: milkInHotDrinkPortionSizeParameters,
});
export type MilkInHotDrinkPsm = z.infer<typeof milkInHotDrinkPsm>;

export const milkOnCerealPsm = portionSizeMethodBase.extend({
  method: z.literal('milk-on-cereal'),
  parameters: milkOnCerealPortionSizeParameters,
});
export type MilkOnCerealPsm = z.infer<typeof milkOnCerealPsm>;

export const parentFoodPsm = portionSizeMethodBase.extend({
  method: z.literal('parent-food-portion'),
  parameters: parentFoodPortionParameters,
});
export type ParentFoodPsm = z.infer<typeof parentFoodPsm>;

export const pizzaPsm = portionSizeMethodBase.extend({
  method: z.literal('pizza'),
  parameters: pizzaPortionSizeParameters,
});
export type PizzaPsm = z.infer<typeof pizzaPsm>;

export const pizzaV2Psm = portionSizeMethodBase.extend({
  method: z.literal('pizza-v2'),
  parameters: pizzaV2PortionSizeParameters,
});
export type PizzaV2Psm = z.infer<typeof pizzaV2Psm>;

export const recipeBuilderPsm = portionSizeMethodBase.extend({
  method: z.literal('recipe-builder'),
  parameters: recipeBuilderPortionSizeParameters,
});
export type RecipeBuilderPsm = z.infer<typeof recipeBuilderPsm>;

export const standardPortionPsm = portionSizeMethodBase.extend({
  method: z.literal('standard-portion'),
  parameters: standardPortionSizeParameters,
});
export type StandardPortionPsm = z.infer<typeof standardPortionPsm>;

export const unknownPsm = portionSizeMethodBase.extend({
  method: z.literal('unknown'),
  parameters: unknownPortionSizeParameters,
});
export type UnknownPsm = z.infer<typeof unknownPsm>;

export const portionSizeMethod = z.discriminatedUnion('method', [
  asServedPsm,
  autoPsm,
  cerealPsm,
  directWeightPsm,
  drinkScalePsm,
  guideImagePsm,
  milkInHotDrinkPsm,
  milkOnCerealPsm,
  parentFoodPsm,
  pizzaPsm,
  pizzaV2Psm,
  recipeBuilderPsm,
  standardPortionPsm,
  unknownPsm,
]);
export type PortionSizeMethod = z.infer<typeof portionSizeMethod>;

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

const autoPortionSizeState = portionSizeStateBase.extend({
  method: z.literal('auto'),
  mode: z.enum(autoPsmModes),
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
  linkedQuantity: z.number(),
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
  auto: autoPortionSizeState,
  cereal: cerealPortionSizeState,
  'direct-weight': directWeightPortionSizeState,
  'drink-scale': drinkScalePortionSizeState,
  'guide-image': guideImagePortionSizeState,
  'milk-in-a-hot-drink': milkInHotDrinkPortionSizeState,
  'milk-on-cereal': milkOnCerealPortionSizeState,
  'parent-food-portion': parentFoodPortionPortionSizeState,
  pizza: pizzaPortionSizeState,
  'pizza-v2': pizzaV2PortionSizeState,
  'standard-portion': standardPortionPortionSizeState,
  unknown: unknownPortionSizeState,
});
export type PortionSizeStates = z.infer<typeof portionSizeStates>;
export type PortionSizeState = PortionSizeStates[keyof PortionSizeStates];
