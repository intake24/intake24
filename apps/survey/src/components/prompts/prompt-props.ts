import type { PropType } from 'vue';

import type { Prompts, PromptStates } from '@intake24/common/prompts';
import type { EncodedFood, FoodState, MealState, MissingFood, PromptSection, RecipeBuilder } from '@intake24/common/surveys';
import type { UserPortionSizeMethod } from '@intake24/common/types/http';

export function createBasePromptProps<P extends keyof Prompts, F extends FoodState = EncodedFood>() {
  return {
    food: {
      type: Object as PropType<F>,
    },
    meal: {
      type: Object as PropType<MealState>,
    },
    prompt: {
      type: Object as PropType<Prompts[P]>,
      required: true,
    },
    section: {
      type: String as PropType<PromptSection>,
      required: true,
    },
  } as const;
};

export function createMealPromptProps<P extends keyof Prompts & keyof PromptStates, F extends FoodState = EncodedFood>() {
  return {
    ...createBasePromptProps<P, F>(),
    meal: {
      type: Object as PropType<MealState>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<PromptStates[P]>,
      required: true,
    },
  } as const;
};

export function createFoodPromptProps<P extends keyof Prompts & keyof PromptStates, F extends FoodState = EncodedFood, PF extends EncodedFood | RecipeBuilder = EncodedFood | RecipeBuilder>() {
  return {
    ...createBasePromptProps<P, F>(),
    food: {
      type: Object as PropType<F>,
      required: true,
    },
    parentFood: {
      type: Object as PropType<PF>,
    },
    meal: {
      type: Object as PropType<MealState>,
      required: true,
    },
    modelValue: {
      type: [Number, String, Array, Object] as PropType<PromptStates[P]>,
      required: true,
    },
  } as const;
};

export function createPortionPromptProps<P extends keyof Prompts & keyof PromptStates, F extends EncodedFood | MissingFood | RecipeBuilder = EncodedFood, PF extends EncodedFood | RecipeBuilder = EncodedFood | RecipeBuilder>() {
  return {
    ...createFoodPromptProps<P, F, PF>(),
    portionSizeMethods: {
      type: Array as PropType<(UserPortionSizeMethod & { index: number })[]>,
      default: () => [],
    },
  } as const;
};
