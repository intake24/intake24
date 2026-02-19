import type { Prompts } from '@intake24/common/prompts';
import type { AutoPsm, EncodedFood, FoodFlag, FoodState, Pathway, PortionSizeMethodId, PortionSizeState, PortionSizeStates } from '@intake24/common/surveys';
import type { UserFoodData, UserPortionSizeMethod } from '@intake24/common/types/http';

import { computed } from 'vue';

import { useSurvey } from '@intake24/survey/stores';

export type LinkedParent = {
  auto: boolean;
  categories: Prompts['guide-image-prompt']['linkedQuantity']['parent'];
  quantity: number;
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
      throw new Error('This selected food must be an encoded food');
    }

    return food.value;
  });

  // TODO: should improve EncodedFood type to avoid this type assertion
  const encodedFoodPortionSizeData = computed<PortionSizeStates[Exclude<T, 'recipe-builder'>] | null>(() => encodedFood.value.portionSize as PortionSizeStates[Exclude<T, 'recipe-builder'>] | null);

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

  const pathway = computed(() => {
    const parent = parentFoodOptional.value;
    if (!parent)
      return 'search';

    if (parent.type === 'encoded-food')
      return 'afp';

    if (parent.type === 'recipe-builder')
      return 'recipe';

    return 'search';
  });

  function getPortionSizeMethods(methods: UserPortionSizeMethod[], pathway: Pathway, parent?: FoodState) {
    return methods
      .map((method, index) => ({ ...method, index }))
      .filter(
        ({ method, pathways }) => {
          if (!survey.registeredPortionSizeMethods.includes(method))
            return false;

          if (!pathways.includes(pathway))
            return false;

          if (parentFoodRequiredPSMs.includes(method) && !parent)
            return false;

          return true;
        },
      );
  }

  const portionSizeMethods = computed(() =>
    getPortionSizeMethods(encodedFood.value.data.portionSizeMethods, pathway.value, parentFoodOptional.value));

  const portionSize = computed(() => {
    const selectedFood = encodedFood.value;
    if (selectedFood.portionSizeMethodIndex === null)
      throw new Error('This prompt requires a portion size option to be selected');

    return selectedFood.data.portionSizeMethods[selectedFood.portionSizeMethodIndex];
  });

  function getLinkedParent(foodData: UserFoodData | undefined, parentFood: FoodState | undefined): LinkedParent | undefined {
    if (!foodData || !parentFood || (parentFood.type !== 'encoded-food' && parentFood.type !== 'recipe-builder'))
      return undefined;

    const lQ = survey.linkedQuantity;
    if (!Object.keys(lQ).length)
      return undefined;

    const foods = parentFood.type === 'encoded-food' ? [parentFood] : parentFood.linkedFoods;

    const food = foods.find(food =>
      food.type === 'encoded-food'
      && food.portionSize
      && 'quantity' in food.portionSize
      && (food.portionSize.quantity ?? 0) > 1,
    ) as EncodedFood | undefined;

    if (!food?.portionSize)
      return undefined;

    const prompt = `${food.portionSize.method}-prompt`;
    if (!lQ[prompt]?.source.some(cat => foodData.categories.includes(cat)))
      return undefined;

    return {
      auto: !!lQ[prompt].auto,
      categories: lQ[prompt].parent.filter(cat => food.data.categories.includes(cat.code)) ?? [],
      quantity: 'quantity' in food.portionSize ? (food.portionSize.quantity ?? 1) : 1,
    };
  }

  function getAutoPsmWeight({ parameters: { mode, value } }: AutoPsm, parent?: FoodState): { servingWeight: number; leftoversWeight: number } {
    if (mode === 'weight')
      return { servingWeight: value, leftoversWeight: 0 };

    if (parent?.type !== 'encoded-food' || !parent.portionSize) {
      console.warn(`Default weight mode "${mode}" requires parent encoded food with portion size to be selected`);
      return { servingWeight: 0, leftoversWeight: 0 };
    }

    const { servingWeight, leftoversWeight } = parent.portionSize;
    return {
      servingWeight: (servingWeight ?? 0) / 100 * value,
      leftoversWeight: (leftoversWeight ?? 0) / 100 * value,
    };
  }

  function resolvePortionSize(foodData: UserFoodData, pathway: Pathway, parent?: FoodState): {
    flags: FoodFlag[];
    portionSizeMethodIndex: number | null;
    portionSize: PortionSizeState | null;
  } {
    const flags: FoodFlag[] = [];
    let portionSizeMethodIndex: number | null = null;
    let portionSize: PortionSizeState | null = null;

    const portionSizeMethods = getPortionSizeMethods(foodData.portionSizeMethods, pathway, parent);
    const autoPsmIdx = portionSizeMethods.findIndex(psm => psm.method === 'auto');
    const autoPsm = (autoPsmIdx !== -1 ? portionSizeMethods.at(autoPsmIdx) : undefined) as AutoPsm | undefined;
    if (autoPsm) {
      const { servingWeight, leftoversWeight } = getAutoPsmWeight(autoPsm, parent);
      const linkedQuantity = getLinkedParent(foodData, parent)?.quantity ?? 1;
      portionSizeMethodIndex = autoPsmIdx;
      portionSize = {
        method: 'auto',
        servingWeight: servingWeight * autoPsm.conversionFactor * linkedQuantity,
        leftoversWeight: leftoversWeight * autoPsm.conversionFactor * linkedQuantity,
        mode: autoPsm.parameters.mode,
        quantity: autoPsm.parameters.value,
        linkedQuantity,
      };
      flags.push('portion-size-option-complete', 'portion-size-method-complete');
    }
    else if (portionSizeMethods.length === 1) {
      portionSizeMethodIndex = portionSizeMethods[0].index;
      flags.push('portion-size-option-complete');
    }

    return { flags, portionSizeMethodIndex, portionSize };
  }

  const linkedParent = computed(() => getLinkedParent(encodedFoodOptional.value?.data, parentFoodOptional.value));
  const linkedParentQuantity = computed(() => linkedParent.value?.quantity ?? 1);

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
    resolvePortionSize,
    freeTextFood,
    foodName,
    initializeRecipeComponents,
    missingFood,
    portionSize,
    portionSizeMethods,
    recipeBuilder,
  };
}
