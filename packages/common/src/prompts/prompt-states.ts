import type {
  FoodState,
  MissingFood,
  PortionSizeStates,
} from '../surveys';
import type {
  RecipeFood,
  RequiredLocaleTranslation,
} from '../types';
import type { FoodHeader, UserFoodData } from '../types/http';
import type { AddonFood } from './prompts';

export type AssociatedFoodPromptItem = {
  confirmed?: 'yes' | 'no';
  type?: 'selected' | 'missing' | 'existing';
  selectedFood?: FoodHeader;
  existingFoodId?: string;
};

export type AssociatedFoodPrompt = {
  mainFoodConfirmed?: 'yes' | 'no' | 'dontknow';
  additionalFoodConfirmed?: boolean;
  foods: AssociatedFoodPromptItem[];
};

export type MissingFoodRecipeBuilderItemState = {
  type: 'missing';
  id: string;
  idx: number;
  name: string;
  searchTerm?: string | null;
};

export type SelectedFoodRecipeBuilderItemState = FoodHeader & {
  type: 'selected';
  id: string;
  idx: number;
  ingredient: UserFoodData;
};

export type FoodRecipeBuilderItemState
  = | MissingFoodRecipeBuilderItemState
    | SelectedFoodRecipeBuilderItemState;

export type RecipeBuilderStepState = {
  confirmed?: 'yes' | 'no';
  anotherFoodConfirmed?: boolean;
  foods: FoodRecipeBuilderItemState[];
  order: number;
  description: RequiredLocaleTranslation;
  name: RequiredLocaleTranslation;
  categoryCode: string;
  repeat: boolean;
  required: boolean;
};

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
    recipe: RecipeFood;
    activeStep: number;
    recipeSteps: RecipeBuilderStepState[];
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
    mainFoodConfirmed?: 'yes' | 'no' | 'dontknow';
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
