import type { Prompts } from '@intake24/common/prompts';
import type { EncodedFood, PortionSizeMethodId, PortionSizeStates } from '@intake24/common/surveys';
import type { UserFoodData } from '@intake24/common/types/http';

import { computed } from 'vue';

import { useSurvey } from '@intake24/survey/stores';

export type LinkedParent = {
  auto: boolean;
  categories: Prompts['guide-image-prompt']['linkedQuantity']['parent'];
  food: EncodedFood;
};

const parentFoodRequiredPSMs: PortionSizeMethodId[] = [
  'milk-in-a-hot-drink',
  'parent-food-portion',
];

export function useFoodPromptUtils<T extends PortionSizeMethodId>() {
  const survey = useSurvey();

  const localeId = computed(() => survey.localeId);
  const surveySlug = computed(() => survey.slug);
  const meals = computed(() => survey.meals);
  const foodIndex = computed(() => survey.selectedFoodIndex);
  const foodOptional = computed(() => survey.selectedFoodOptional);
  const parentFoodOptional = computed(() => {
    const food = survey.selectedParentFood;
    if (!food)
      return undefined;

    if (food.type !== 'encoded-food' && food.type !== 'recipe-builder') {
      console.log(food);
      throw new Error('This selected food must be an encoded food or recipe builder');
    }

    return food;
  });

  const parentFood = computed(() => {
    if (parentFoodOptional.value === undefined)
      throw new Error('This prompt requires parent food to be selected');

    return parentFoodOptional.value;
  });

  const parentEncodedFood = computed(() => {
    if (parentFoodOptional.value?.type !== 'encoded-food')
      throw new Error('This prompt requires parent encoded food to be selected');

    return parentFoodOptional.value;
  });

  const food = computed(() => {
    if (foodOptional.value === undefined)
      throw new Error('This prompt requires a food to be selected');

    return foodOptional.value;
  });

  const encodedFood = computed(() => {
    if (food.value.type !== 'encoded-food') {
      console.log(food.value);
      throw new Error('This selected food must be an encoded food');
    }

    return food.value;
  });

  // TODO: should improve EncodedFood type to avoid this type assertion
  const encodedFoodPortionSizeData = computed<PortionSizeStates[T] | null>(() => encodedFood.value.portionSize as PortionSizeStates[T] | null);

  const encodedFoodOptional = computed(() => {
    if (foodOptional.value === undefined || foodOptional.value.type !== 'encoded-food')
      return undefined;

    return encodedFood.value;
  });

  const freeTextFood = computed(() => {
    if (food.value.type !== 'free-text')
      throw new Error('This selected food must be an free-text food');

    return food.value;
  });

  const missingFood = computed(() => {
    if (food.value.type !== 'missing-food')
      throw new Error('This selected food must be an missing food');

    return food.value;
  });

  const recipeBuilder = computed(() => {
    if (food.value.type !== 'recipe-builder')
      throw new Error('This selected food must be an Recipe Builder food');

    return food.value;
  });

  const foodName = computed(() => ({ en: encodedFood.value.data.localName }));

  const portionSizeMethods = computed(() =>
    encodedFood.value.data.portionSizeMethods.map((item, index) => ({ ...item, index })).filter(
      item =>
        survey.registeredPortionSizeMethods.includes(item.method)
        && (!parentFoodRequiredPSMs.includes(item.method) || !!parentFoodOptional.value),
    ),
  );

  const portionSize = computed(() => {
    const selectedFood = encodedFood.value;
    if (selectedFood.portionSizeMethodIndex === null)
      throw new Error('This prompt requires a portion size option to be selected');

    return selectedFood.data.portionSizeMethods[selectedFood.portionSizeMethodIndex];
  });

  const linkedQuantityCategories = (data: UserFoodData) =>
    survey.linkedQuantity?.parent.filter(cat => data.categories.includes(cat.code)) ?? [];

  const linkedParent = computed<LinkedParent | undefined>(() => {
    const source = encodedFood.value.data.categories.find(cat =>
      survey.linkedQuantity?.source.includes(cat),
    );
    if (!source)
      return undefined;

    if (
      parentFoodOptional.value?.type === 'encoded-food'
      && parentFoodOptional.value.portionSize?.method === 'guide-image'
      && parentFoodOptional.value.portionSize.quantity > 1
    ) {
      return {
        auto: !!survey.linkedQuantity?.auto,
        categories: linkedQuantityCategories(parentFoodOptional.value.data),
        food: parentFoodOptional.value,
      };
    }

    if (parentFoodOptional.value?.type === 'recipe-builder') {
      const food = parentFoodOptional.value.linkedFoods.find(
        food =>
          food.type === 'encoded-food'
          && food.portionSize?.method === 'guide-image'
          && food.portionSize.quantity > 1,
      ) as EncodedFood | undefined;

      if (food) {
        return {
          auto: !!survey.linkedQuantity?.auto,
          categories: linkedQuantityCategories(food.data),
          food,
        };
      }
    }

    return undefined;
  });

  const linkedParentQuantity = computed(() =>
    linkedParent.value?.food?.portionSize?.method === 'guide-image'
      ? linkedParent.value.food.portionSize.quantity
      : 1,
  );

  const initializeRecipeComponents = (steps: number[]) =>
    steps.map(step => ({ ingredients: [], order: step }));

  return {
    food,
    foodIndex,
    foodOptional,
    linkedParent,
    linkedParentQuantity,
    localeId,
    surveySlug,
    meals,
    parentEncodedFood,
    parentFood,
    parentFoodOptional,
    encodedFood,
    encodedFoodPortionSizeData,
    encodedFoodOptional,
    freeTextFood,
    foodName,
    initializeRecipeComponents,
    missingFood,
    portionSize,
    portionSizeMethods,
    recipeBuilder,
  };
}
