<template>
  <associated-foods-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
      localeId,
      surveySlug,
      prompt,
      prompts: associatedFoodPrompts,
      section,
    }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { AssociatedFoodPrompt, PromptStates } from '@intake24/common/prompts';
import type { EncodedFood, FoodFlag, FoodState, MissingFood } from '@intake24/common/surveys';
import type { FoodHeader, UserFoodData } from '@intake24/common/types/http';
import { capitalize } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { AssociatedFoodsPrompt } from '@intake24/survey/components/prompts/standard';
import { foodsService } from '@intake24/survey/services';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId, getFoodIndexRequired } from '@intake24/survey/util';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'associated-foods-prompt'>());

const emit = defineEmits(['action']);

function initialPromptState(allowMultiple: boolean): AssociatedFoodPrompt {
  return {
    mainFoodConfirmed: undefined,
    additionalFoodConfirmed: allowMultiple ? undefined : false,
    foods: [],
  };
}

interface LinkAsMainNew {
  header: FoodHeader;
  linkAsMain: boolean;
}

interface LinkAsMainExisting {
  id: string;
  linkAsMain: boolean;
}

const { translate } = useI18n();
const { encodedFood: food, localeId, surveySlug, meals } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const survey = useSurvey();

function getInitialState(): PromptStates['associated-foods-prompt'] {
  return {
    activePrompt: 0,
    promptStates: food.value.data.associatedFoodPrompts.map(prompt =>
      initialPromptState(props.prompt.multiple && prompt.multiple),
    ),
  };
}

const associatedFoodPrompts = computed(() => food.value.data.associatedFoodPrompts);

const { state, update, clearStoredStateById } = usePromptHandlerStore(props, { emit }, getInitialState);

async function fetchFoodData(headers: FoodHeader[]): Promise<UserFoodData[]> {
  // TODO: Show loading

  return Promise.all(
    headers.map(header => foodsService.getData(localeId.value, header.code)),
  );
}

// The link as main feature can be applied only if exactly one of the linked foods has the
// 'link-as-main' flag.
//
// In that case we need to reverse the relationship so that the linked food becomes the
// new main (top level) food, the current main food becomes linked to that food and any foods
// that were linked to the current main food become linked to the new main food.
function processLinkAsMain(foodId: string) {
  const oldFoodIndex = getFoodIndexRequired(meals.value, foodId);
  const oldMainFood = meals.value[oldFoodIndex.mealIndex].foods[oldFoodIndex.foodIndex];
  const newMainFoods = oldMainFood.linkedFoods.filter(food =>
    food.flags.includes('link-as-main'),
  );

  // We don't need the flags anymore so we can clear them here
  oldMainFood.linkedFoods.forEach((food) => {
    food.flags = food.flags.filter(flag => flag !== 'link-as-main');
  });

  if (newMainFoods.length === 1) {
    // Disable associated food prompts on the new main food, which is a workaround for
    // the following issues:
    //
    // V4-903: Associated food prompts logic assumes that the food has no linked foods and will
    //    overwrite any existing linked foods.
    //
    // V4-904: Associated food prompt on the new main food will not recognise the food that triggered
    //    the addition in the first place, for example if jam triggered the AFP that added toast,
    //    and toast becomes new main food, the AFP on toast will not recognise jam and will
    //    suggest adding another instance.

    const newMainFood: FoodState = {
      ...newMainFoods[0],
      flags: [...newMainFoods[0].flags, 'associated-foods-complete'],
    };

    const foodsUpdate = [...meal.value.foods];

    foodsUpdate[oldFoodIndex.foodIndex] = newMainFood;

    newMainFood.linkedFoods = [
      oldMainFood,
      ...oldMainFood.linkedFoods.filter(food => food.id !== newMainFood.id),
    ];
    oldMainFood.linkedFoods = [];

    survey.setFoods({ mealId: meal.value.id, foods: foodsUpdate });
  }
  else {
    // Nothing we can do, abort
  }
}

async function commitAnswer() {
  // The legacy "link as main" feature doesn't make sense when combined with the multiple foods
  // option (because it is defined on the prompt level and there cannot be several main foods),
  // but we still need to support it when possible.
  //
  // The strategy is to add a 'link-as-main' flag to each food that comes from a prompt with
  // this option enabled, and then check if the final set of foods still makes sense for the
  // feature.
  //
  // For clarity the checks are done in a separate function, so we just need to collect the link
  // as main flags here.

  const newFoods: LinkAsMainNew[] = [];
  const missingFoods: MissingFood[] = [];
  const existingFoods: LinkAsMainExisting[] = [];

  state.value.promptStates.forEach((prompt, idx) => {
    const promptDef = food.value.data.associatedFoodPrompts[idx];

    if (prompt.mainFoodConfirmed) {
      prompt.foods.forEach((food) => {
        switch (food.type) {
          case 'selected':
            if (food.selectedFood !== undefined)
              newFoods.push({ header: food.selectedFood, linkAsMain: promptDef.linkAsMain });
            break;
          case 'existing':
            if (food.existingFoodId !== undefined)
              existingFoods.push({ id: food.existingFoodId, linkAsMain: promptDef.linkAsMain });
            break;
          case 'missing':
            missingFoods.push({
              id: getEntityId(),
              type: 'missing-food',
              info: null,
              searchTerm: capitalize(translate(promptDef.genericName)),
              customPromptAnswers: {},
              flags: [
                ...(promptDef.linkAsMain ? ['link-as-main'] : []),
                ...(props.prompt.skipFollowUpPrompts ? ['associated-foods-complete'] : []),
              ] as FoodFlag[],
              linkedFoods: [],
            });
            break;
        }
      });
    }
  });

  const foodId = food.value.id;
  const foodIndex = getFoodIndexRequired(meals.value, foodId);
  const mealIndex = foodIndex.mealIndex;
  const mealId = meals.value[mealIndex].id;

  // Existing foods in this meal that were marked as 'associated foods already entered' by one
  // of the associated food prompts.
  //
  // These need to be moved to the current food's linked meal list.
  const moveFoods: EncodedFood[] = [];

  // The rest of the foods in this meal that should stay how they are.
  const keepFoods: FoodState[] = [];

  meals.value[mealIndex].foods.forEach((food) => {
    const existingFoodRef = existingFoods.find(ref => ref.id === food.id);

    if (food.type === 'encoded-food' && existingFoodRef !== undefined) {
      if (existingFoodRef.linkAsMain)
        food.flags = [...food.flags, 'link-as-main'];

      moveFoods.push(food);
    }
    else {
      keepFoods.push(food);
    }
  });

  const foodData = await fetchFoodData(newFoods.map(f => f.header));

  const linkedFoods: FoodState[] = foodData.map((data, index) => {
    const hasOnePortionSizeMethod = data.portionSizeMethods.length === 1;

    const flags: FoodFlag[] = [];
    if (hasOnePortionSizeMethod)
      flags.push('portion-size-option-complete');
    if (props.prompt.skipFollowUpPrompts)
      flags.push('associated-foods-complete');
    if (newFoods[index].linkAsMain)
      flags.push('link-as-main');

    return {
      type: 'encoded-food',
      id: getEntityId(),
      flags,
      linkedFoods: [],
      customPromptAnswers: {},
      data,
      searchTerm: newFoods[index].header.searchTerm ?? null,
      portionSizeMethodIndex: hasOnePortionSizeMethod ? 0 : null,
      portionSize: null,
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
      flags: [...new Set([...food.flags, 'associated-foods-complete'])] as FoodFlag[],
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

  survey.addFoodFlag(foodId, 'associated-foods-complete');

  processLinkAsMain(foodId);

  clearStoredStateById(foodId);

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
