import type {
  FoodState,
  MissingFood,
  PortionSizeStates,
  StandardUnit,
} from '../surveys';
import type { FoodHeader, UserFoodData } from '../types/http';
import type { CoefficientStep, ConditionStep, FoodBuilderStepType, IngredientStep, LookupResourceStep, LookupUnitStep, QuantityStep } from '../types/http/admin';
import type { Condition } from './conditions';
import type { AddonFood } from './prompts';

export type AssociatedFoodPromptItem = {
  confirmed?: 'yes' | 'no';
  type?: 'selected' | 'missing' | 'existing';
  selectedFood?: FoodHeader;
  existingFoodId?: string;
};

export type AssociatedFoodPrompt = {
  mainFoodConfirmed?: boolean;
  additionalFoodConfirmed?: boolean;
  foods: AssociatedFoodPromptItem[];
};

export type MissingFoodRecipeBuilderItemState = {
  type: 'missing';
  name: string;
  searchTerm?: string | null;
};

export type SelectedFoodRecipeBuilderItemState = FoodHeader & {
  type: 'selected';
  ingredient: UserFoodData;
};
export type FoodRecipeBuilderItemState = MissingFoodRecipeBuilderItemState | SelectedFoodRecipeBuilderItemState;

export type FoodBuilderCoefficientStepState = Pick<CoefficientStep, 'type'> & {
  option: number | null;
};

export type FoodBuilderConditionStepState = Pick<ConditionStep, 'type'> & {
  option: Condition[] | null;
};

export type FoodBuilderIngredientStepState = Pick<IngredientStep, 'type'> & {
  confirmed?: 'yes' | 'no';
  anotherFoodConfirmed?: boolean;
  foods: FoodRecipeBuilderItemState[];
};

export type FoodBuilderLookupResourceStepState = Pick<LookupResourceStep, 'type'> & {
  option: string | null;
};

export type FoodBuilderLookupUnitStepState = Pick<LookupUnitStep, 'type'> & {
  option: StandardUnit | null;
};

export type FoodBuilderQuantityStepState = Pick<QuantityStep, 'type'> & {
  quantity: number;
  confirmed: boolean;
};

export type FoodBuilderStepState
  = | FoodBuilderCoefficientStepState
    | FoodBuilderConditionStepState
    | FoodBuilderIngredientStepState
    | FoodBuilderLookupResourceStepState
    | FoodBuilderLookupUnitStepState
    | FoodBuilderQuantityStepState;

export type GetFoodBuilderStateStep<U extends FoodBuilderStepType> = Extract<FoodBuilderStepState, { type: U }>;

export type PromptStates = {
  'as-served-prompt': {
    portionSize: PortionSizeStates['as-served'];
    panel: number;
    servingImageConfirmed: boolean;
    leftoversImageConfirmed: boolean;
    leftoversPrompt?: boolean;
    linkedQuantityConfirmed: boolean;
    quantityConfirmed: boolean;
  };
  'cereal-prompt': {
    portionSize: PortionSizeStates['cereal'];
    panel: number;
    bowlConfirmed: boolean;
    servingImageConfirmed: boolean;
    leftoversImageConfirmed: boolean;
    leftoversPrompt?: boolean;
  };
  'direct-weight-prompt': {
    portionSize: PortionSizeStates['direct-weight'];
    panel: number;
  };
  'drink-scale-prompt': {
    portionSize: PortionSizeStates['drink-scale'];
    panel: number;
    objectConfirmed: boolean;
    volumeConfirmed: boolean;
    leftoversConfirmed: boolean;
    leftoversPrompt?: boolean;
    quantityConfirmed: boolean;
  };
  'generic-builder-prompt': {
    food: UserFoodData | null;
    portionSize: PortionSizeStates['standard-portion'];
    steps: FoodBuilderStepState[];
    activeStep: number;
  };
  'guide-image-prompt': {
    portionSize: PortionSizeStates['guide-image'];
    panel: number;
    objectConfirmed: boolean;
    quantityConfirmed: boolean;
    linkedQuantityConfirmed: boolean;
  };
  'milk-in-a-hot-drink-prompt': {
    portionSize: PortionSizeStates['milk-in-a-hot-drink'];
    panel: number;
  };
  'milk-on-cereal-prompt': {
    portionSize: PortionSizeStates['milk-on-cereal'];
    panel: number;
    bowlConfirmed: boolean;
    milkLevelConfirmed: boolean;
  };
  'missing-food-prompt': {
    info: NonNullable<MissingFood['info']>;
    panel: number;
    homemadePrompt?: boolean;
  };
  'parent-food-portion-prompt': {
    portionSize: PortionSizeStates['parent-food-portion'];
    panel: number;
  };
  'pizza-prompt': {
    portionSize: PortionSizeStates['pizza'];
    panel: number;
    confirmed: {
      type: boolean;
      thickness: boolean;
      slice: boolean;
      quantity: boolean;
    };
  };
  'pizza-v2-prompt': {
    portionSize: PortionSizeStates['pizza-v2'];
    panel: number;
    confirmed: {
      size: boolean;
      crust: boolean;
      unit: boolean;
      quantity: boolean;
    };
  };
  'portion-size-option-prompt': {
    option: number | null;
  };
  'recipe-builder-prompt': {
    steps: FoodBuilderIngredientStepState[];
    activeStep: number;
  };
  'standard-portion-prompt': {
    portionSize: PortionSizeStates['standard-portion'];
    panel: number;
    quantityConfirmed: boolean;
    linkedQuantityConfirmed: boolean;
  };
  'unknown-prompt': {
    portionSize: PortionSizeStates['unknown'];
    panel: number;
  };
  // Standard prompts
  'addon-foods-prompt': {
    foods: Record<string, {
      confirmed: boolean | null;
      data: UserFoodData | null;
      portionSize: PortionSizeStates['standard-portion'];
      addon: AddonFood;
    }[]>;
  };
  'associated-foods-prompt': {
    activePrompt: number;
    promptStates: AssociatedFoodPrompt[];
  };
  'general-associated-foods-prompt': {
    mainFoodConfirmed?: boolean;
    additionalFoodConfirmed?: boolean;
    foods: AssociatedFoodPromptItem[];
  };
  'edit-meal-prompt': FoodState[];
  'external-source-prompt': {
    searchTerm: string | null;
    type?: 'selected' | 'missing';
    data?: object;
  };
  'ready-meal-prompt': { id: string; name: string; value: boolean | undefined }[];
  'sleep-schedule-prompt': {
    panel: number;
    schedule: {
      wakeUp: string;
      sleep: string;
    };
  };
};

export type PromptState = PromptStates[keyof PromptStates];
