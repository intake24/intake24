<template>
  <associated-foods-prompt
    v-model="associatedFoodsPromptState"
    v-bind="{
      food,
      meal,
      localeId,
      surveySlug,
      prompt: associatedFoodsPromptProps,
      prompts: associatedFoodPrompts,
      section,
    }"
    @action="action"
    @update:model-value="updateState"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { AssociatedFoodPrompt, Prompts, PromptStates } from '@intake24/common/prompts';
import type { EncodedFood, FoodFlag, FoodState, MissingFood, PortionSizeState } from '@intake24/common/surveys';
import type { FoodHeader, UserFoodData } from '@intake24/common/types/http';
import { capitalize } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { AssociatedFoodsPrompt } from '@intake24/survey/components/prompts/standard';
import { foodsService } from '@intake24/survey/services';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId, getFoodIndexRequired } from '@intake24/survey/util';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'general-associated-foods-prompt'>());

const emit = defineEmits(['action']);

function initialPromptState(allowMultiple: boolean): AssociatedFoodPrompt {
  return {
    mainFoodConfirmed: undefined,
    additionalFoodConfirmed: allowMultiple ? undefined : false,
    foods: [],
  };
}

const { translate } = useI18n();
const { encodedFood: food, localeId, surveySlug, meals } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const survey = useSurvey();

function getInitialState(): PromptStates['general-associated-foods-prompt'] {
  return initialPromptState(props.prompt.multiple);
}

const { state, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState);

function updateState(afpState: PromptStates['associated-foods-prompt']) {
  // V4-1521: GAFP state is different from the underlying associatedFoodsPromptState,
  // but usePromptHandlerStore expects state to be updated by the prompt component,
  // which means state has to be handled explicitly.

  state.value = afpState.promptStates[0];
  update(afpState.promptStates[0]);
}

const associatedFoodsPromptState = computed<PromptStates['associated-foods-prompt']>(() => ({
  activePrompt: 0,
  promptStates: [state.value],
}));

const associatedFoodsPromptProps = computed<Prompts['associated-foods-prompt']>(() => ({
  ...props.prompt,
  component: 'associated-foods-prompt',
}));

const associatedFoodPrompts = computed(() => ([{
  id: props.prompt.id,
  categoryCode: props.prompt.categoryCode,
  promptText: props.prompt.promptText,
  linkAsMain: false,
  genericName: props.prompt.genericName,
  multiple: props.prompt.multiple,
}]));

async function fetchFoodData(headers: FoodHeader[]): Promise<UserFoodData[]> {
  // TODO: Show loading

  return Promise.all(
    headers.map(header => foodsService.getData(localeId.value, header.code)),
  );
}

async function commitAnswer() {
  // The logic is generally the same as the food-level associated foods prompt,
  // but this prompt type does not support the link as main feature and is also
  // always singular (regular AFP prompt can handle multiple AFP definitions coming
  // from the database)

  const newFoods: FoodHeader[] = [];
  const missingFoods: MissingFood[] = [];
  const existingFoods: string[] = [];

  if (state.value.mainFoodConfirmed) {
    state.value.foods.forEach((food) => {
      switch (food.type) {
        case 'selected':
          if (food.selectedFood !== undefined)
            newFoods.push(food.selectedFood);
          break;
        case 'existing':
          if (food.existingFoodId !== undefined)
            existingFoods.push(food.existingFoodId);
          break;
        case 'missing':
          missingFoods.push({
            id: getEntityId(),
            type: 'missing-food',
            info: null,
            searchTerm: capitalize(translate(props.prompt.genericName)),
            customPromptAnswers: {},
            flags: [],
            linkedFoods: [],
          });
          break;
      }
    });
  }

  const foodId = food.value.id;
  const foodIndex = getFoodIndexRequired(meals.value, foodId);
  const mealIndex = foodIndex.mealIndex;
  const mealId = meals.value[mealIndex].id;

  // Existing foods in this meal that were marked as 'associated foods already entered'
  // These need to be moved to the current food's linked meal list.
  const moveFoods: EncodedFood[] = [];

  // The rest of the foods in this meal that should stay how they are.
  const keepFoods: FoodState[] = [];

  meals.value[mealIndex].foods.forEach((food) => {
    const existingFoodRef = existingFoods.find(id => id === food.id);

    if (food.type === 'encoded-food' && existingFoodRef !== undefined) {
      moveFoods.push(food);
    }
    else {
      keepFoods.push(food);
    }
  });

  const foodData = await fetchFoodData(newFoods);

  const linkedFoods: FoodState[] = foodData.map((data, index) => {
    const portionSizeState: PortionSizeState | null = props.prompt.skipPortionSize
      ? {
          method: 'direct-weight' as const,
          quantity: 0,
          servingWeight: 0,
          leftoversWeight: 0,
        }
      : null;

    const skipPortionSizeOption = data.portionSizeMethods.length === 1 || props.prompt.skipPortionSize;

    const flags: FoodFlag[] = [];

    if (skipPortionSizeOption)
      flags.push('portion-size-option-complete');

    return {
      type: 'encoded-food',
      id: getEntityId(),
      flags,
      linkedFoods: [],
      customPromptAnswers: {},
      data,
      searchTerm: newFoods[index].searchTerm ?? null,
      portionSizeMethodIndex: skipPortionSizeOption ? 0 : null,
      portionSize: portionSizeState,
    };
  });

  linkedFoods.push(...moveFoods, ...missingFoods);

  survey.setFoods({ mealId, foods: keepFoods });

  if (foodIndex.linkedFoodIndex !== undefined) {
    // This is a linked food. Currently, more than one level of nesting is not supported,
    // so the new foods that came from the associated foods prompt cannot be linked to this one.

    // As a workaround, they can be linked to the parent food.

    // Associated foods prompts for the new linked foods need to be disabled to prevent
    // potential circular associations.
    const linkedFoodsWithoutPrompts = linkedFoods.map(food => ({
      ...food,
      flags: [...new Set([...food.flags, 'associated-foods-complete', 'disable-general-associated-foods'])] as FoodFlag[],
    }));

    const parentFood = meals.value[foodIndex.mealIndex].foods[foodIndex.foodIndex];
    const newLinkedFoods = [...parentFood.linkedFoods, ...linkedFoodsWithoutPrompts];

    // Order of the updates is important because any changes to the linked foods will be
    // overwritten by the update to the parent food.
    survey.updateFood({ foodId: parentFood.id, update: { linkedFoods: newLinkedFoods } });
  }
  else {
    survey.updateFood({ foodId, update: { linkedFoods } });
  }

  survey.addFoodFlag(foodId, `${props.prompt.id}-complete`);

  clearStoredState();

  emit('action', 'next');
}

async function action(type: string, ...args: [id?: string, params?: object]) {
  // The 'next' action is forwarded up the hierarchy by the commitAnswer function instead of here.
  //
  // Due to the async nature of the commitAnswer function, it is not guaranteed that the component
  // hierarchy will remain the same when commitAnswer completes. For instance, the handler component
  // could be unmounted because of a re-render triggered by a change made in the commitAnswer function
  // and since in that case the handler component is no longer the child of the RecallDesktop/RecallMobile
  // component the 'next' event could be lost and the next prompt fail to be triggered.
  if (type === 'next') {
    await commitAnswer();
    return;
  }

  emit('action', type, ...args);
}
</script>
