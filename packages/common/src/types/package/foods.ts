export type PkgInheritableAttributes = {
  readyMealOption?: boolean;
  sameAsBeforeOption?: boolean;
  reasonableAmount?: number;
  useInRecipes?: number;
};

export const PortionSizeMethodTypes = [
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

export type PkgPortionSizeMethodType = (typeof PortionSizeMethodTypes)[number];

export interface PkgDirectWeightPsm extends PkgPortionSizeMethodBase {
  method: 'direct-weight';
}

export interface PkgUnknownPsm extends PkgPortionSizeMethodBase {
  method: 'unknown';
}

export interface PkgPortionSizeMethodBase {
  method: PkgPortionSizeMethodType;
  description: string;
  useForRecipes: boolean;
  conversionFactor: number;
}

export interface PkgAsServedPsm extends PkgPortionSizeMethodBase {
  method: 'as-served';
  servingImageSet: string;
  leftoversImageSet?: string;
  multiple?: boolean;
}

export interface PkgGuideImagePsm extends PkgPortionSizeMethodBase {
  method: 'guide-image';
  guideImageId: string;
}

export interface PkgDrinkScalePsm extends PkgPortionSizeMethodBase {
  method: 'drink-scale';
  drinkwareId: string;
  initialFillLevel: number;
  skipFillLevel: boolean;
  multiple?: boolean;
}

export interface PkgStandardUnit {
  name: string;
  weight: number;
  omitFoodDescription: boolean;
  inlineEstimateIn?: string;
  inlineHowMany?: string;
}

export interface PkgStandardPortionPsm extends PkgPortionSizeMethodBase {
  method: 'standard-portion';
  units: PkgStandardUnit[];
}

export interface PkgCerealPsm extends PkgPortionSizeMethodBase {
  method: 'cereal';
  type: string;
}

export interface PkgPizzaPsm extends PkgPortionSizeMethodBase {
  method: 'pizza';
}

export interface PkgMilkOnCerealPsm extends PkgPortionSizeMethodBase {
  method: 'milk-on-cereal';
}

export interface PkgMilkInHotDrinkPsm extends PkgPortionSizeMethodBase {
  method: 'milk-in-a-hot-drink';
}

export type PkgPortionSizeMethod
  = | PkgAsServedPsm
    | PkgGuideImagePsm
    | PkgDrinkScalePsm
    | PkgStandardPortionPsm
    | PkgCerealPsm
    | PkgMilkOnCerealPsm
    | PkgPizzaPsm
    | PkgMilkInHotDrinkPsm
    | PkgDirectWeightPsm
    | PkgUnknownPsm;

export type PkgAssociatedFood = {
  foodCode?: string;
  categoryCode?: string;
  promptText: Record<string, string>;
  linkAsMain: boolean;
  genericName: Record<string, string>;
};

export type PkgFood = {
  code: string;
  version?: string;
  name: string;
  englishName: string;
  alternativeNames?: Record<string, string[]>;
  tags?: string[];
  attributes: PkgInheritableAttributes;
  parentCategories: string[];
  nutrientTableCodes: Record<string, string>;
  portionSize: PkgPortionSizeMethod[];
  associatedFoods: PkgAssociatedFood[];
  brandNames: string[];
  thumbnailPath?: string;
};
