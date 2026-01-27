<template>
  <same-as-before-prompt
    v-if="sabFood"
    v-bind="{ food, meal, prompt, sabFood, section }"
    @action="action"
    @update:sab-options="onSabOptionsUpdate"
  />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';

import { SameAsBeforePrompt } from '@intake24/survey/components/prompts/standard';
import { useSameAsBefore, useSurvey } from '@intake24/survey/stores';
import { getEntityId } from '@intake24/survey/util';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils } from '../composables';

defineProps(createHandlerProps<'same-as-before-prompt'>());

const emit = defineEmits(['action']);

const { encodedFood: food } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const {
  id: foodId,
  data: { code },
} = food.value;

const survey = useSurvey();

const sabFood = useSameAsBefore().getItem(survey.localeId, code);
const updatedSabFood = {
  ...(sabFood ?? {}),
  food: {
    ...(sabFood?.food ?? {}),
    portionSize: sabFood?.food?.portionSize ? { ...sabFood.food.portionSize } : undefined,
    portionSizeMethodIndex: sabFood?.food?.portionSizeMethodIndex ?? undefined,
    linkedFoods: sabFood?.food?.linkedFoods ? [...sabFood.food.linkedFoods] : [],
    customPromptAnswers: sabFood?.food?.customPromptAnswers ? { ...sabFood.food.customPromptAnswers } : {},
    flags: sabFood?.food?.flags ? [...sabFood.food.flags] : [],
  },
};
function onSabOptionsUpdate(sabOptions: Record<string, boolean>): void {
  console.debug('Received sabOptions from child:', sabOptions);
  if (!sabOptions.portionSize && updatedSabFood.food.portionSize) {
    Object.assign(updatedSabFood.food, { portionSizeMethodIndex: undefined, portionSize: undefined });
    updatedSabFood.food.flags = updatedSabFood.food.flags.filter(flag => !['portion-size-option-complete', 'portion-size-method-complete'].includes(flag));
    console.debug(
      `SAB prompt: portion size option is false. Removed portionSize, portionSizeMethodIndex, and flags 'portion-size-option-complete', 'portion-size-method-complete'. Updated flags: [${updatedSabFood.food.flags.join(', ')}]`,
    );
  }

  if (!sabOptions.linkedFoods && updatedSabFood.food.linkedFoods) {
    updatedSabFood.food.linkedFoods = [];
    updatedSabFood.food.flags = updatedSabFood.food.flags.filter(flag => flag !== 'associated-foods-complete');
    console.debug(
      `SAB prompt: linked foods option is false. Removed linked foods and 'associated-foods-complete' flag. Updated flags: [${updatedSabFood.food.flags.join(', ')}]`,
    );
  }

  if (sabOptions.customPromptAnswers === false && updatedSabFood.food.customPromptAnswers) {
    updatedSabFood.food.customPromptAnswers = {};
    delete updatedSabFood.food.external;
    console.debug(
      `SAB prompt: custom prompt answers option is false. Removed customPromptAnswers and external food.`,
    );
  }
}

function sabAction(type: 'notSame' | 'same') {
  if (type === 'same' && updatedSabFood.food) {
    const { id, ...update } = updatedSabFood.food;
    survey.updateFood({
      foodId,
      update: {
        ...update,
        linkedFoods: update.linkedFoods.map(linkedFood => ({
          ...linkedFood,
          id: getEntityId(),
        })),
      },
    });
  }

  survey.addFoodFlag(foodId, 'same-as-before-complete');
  emit('action', 'next');
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (['notSame', 'same'].includes(type)) {
    sabAction(type as 'notSame' | 'same');
    return;
  }

  emit('action', type, ...args);
}

onMounted(() => {
  if (!sabFood)
    sabAction('notSame');
});
</script>
