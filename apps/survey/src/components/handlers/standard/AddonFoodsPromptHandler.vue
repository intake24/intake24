<template>
  <addon-foods-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
      meals,
      localeId,
      prompt,
      section,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PromptStates } from '@intake24/common/prompts';
import type { FoodState, PortionSizeParameters } from '@intake24/common/surveys';
import { AddonFoodsPrompt } from '@intake24/survey/components/prompts/standard';
import { filterForAddonFoods } from '@intake24/survey/dynamic-recall/prompt-filters';
import { useSurvey } from '@intake24/survey/stores';
import { flattenFoods, getEntityId } from '@intake24/survey/util';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'addon-foods-prompt'>());

const emit = defineEmits(['action']);

const { encodedFoodOptional: food, localeId } = useFoodPromptUtils();
const { mealOptional: meal } = useMealPromptUtils();
const survey = useSurvey();

const addons = computed(() => filterForAddonFoods(survey, props.prompt, meal.value));

const meals = computed(() => {
  const mealEntry = meal.value;

  if (mealEntry) {
    // Food-level prompt
    const foodEntry = food.value;
    if (foodEntry?.id) {
      return [{
        ...mealEntry,
        foods: [foodEntry].filter(food => addons.value[mealEntry.id][food.id].length),
      }].filter(meal => meal.foods.length);
    }

    // Meal-level prompt
    return [{
      ...mealEntry,
      foods: flattenFoods(mealEntry.foods).filter(food => addons.value[mealEntry.id][food.id].length),
    }].filter(meal => meal.foods.length);
  }

  // Survey-level prompt
  return survey.meals.map(meal => ({
    ...meal,
    foods: flattenFoods(meal.foods).filter(food => addons.value[meal.id][food.id].length),
  })).filter(meal => meal.foods.length);
});

const getInitialState = computed(() => ({
  foods: meals.value.reduce<PromptStates['addon-foods-prompt']['foods']>((acc, meal) => {
    meal.foods.forEach((food) => {
      acc[food.id] = addons.value[meal.id][food.id].map(addon => ({
        confirmed: null,
        data: null,
        portionSize: {
          method: 'standard-portion',
          unit: null,
          quantity: 0,
          linkedQuantity: 1,
          servingWeight: 0,
          leftoversWeight: 0,
        },
        addon,
      }));
    });
    return acc;
  }, {}),
}));

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function commitAnswer() {
  for (const [foodId, addons] of Object.entries(state.value.foods)) {
    const linkedFoods = addons.reduce<FoodState[]>((acc, addonFood) => {
      const { confirmed, data, portionSize, addon: { entity, code, id } } = addonFood;
      if (confirmed === undefined) {
        console.warn('AddonFoodsPromptHandler: not confirmed or no food data!');
        return acc;
      }

      if (confirmed === false || !data)
        return acc;

      const portionSizeMethodIndex = data.portionSizeMethods.findIndex(psm =>
        psm.method === portionSize.method
        && (psm.parameters as PortionSizeParameters['standard-portion']).units.find(unit => unit.name === portionSize.unit?.name));

      acc.push(
        {
          type: 'encoded-food',
          id: getEntityId(),
          flags: ['portion-size-option-complete', 'portion-size-method-complete'],
          linkedFoods: [],
          customPromptAnswers: {},
          data,
          searchTerm: [props.prompt.component, props.prompt.id, entity, code, id].join(':'),
          portionSizeMethodIndex,
          portionSize,
        },
      );
      return acc;
    }, []);

    survey.addLinkedFoods(foodId, linkedFoods);
    survey.addFoodFlag(foodId, `${props.prompt.id}-complete`);
  }
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}
</script>
