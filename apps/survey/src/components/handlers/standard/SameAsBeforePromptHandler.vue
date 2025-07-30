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
  if (!sabOptions.portionSize && updatedSabFood?.food?.portionSize) {
    updatedSabFood.food.portionSizeMethodIndex = undefined;
    updatedSabFood.food.portionSize = undefined;
    console.debug('PortionSize and Portion method index is removed as SAB prompt checkbox is explicitly set to false');
    if (Array.isArray(updatedSabFood.food.flags)) {
      updatedSabFood.food.flags = updatedSabFood.food.flags.filter(
        (flag: string) =>
          flag !== 'portion-size-option-complete'
          && flag !== 'portion-size-method-complete',
      );
      console.debug('portion-size-option-complete and portion-size-method-complete flag removed:', updatedSabFood.food.flags);
    }
  }

  if (!sabOptions.linkedFoods && updatedSabFood?.food?.linkedFoods) {
    updatedSabFood.food.linkedFoods = [];
    console.debug('Linked foods are removed as SAB prompt linked foods checkbox is explicitly set to false');
    if (Array.isArray(updatedSabFood.food.flags)) {
      updatedSabFood.food.flags = updatedSabFood.food.flags.filter(
        (flag: string) => flag !== 'associated-foods-complete',
      );
      console.debug('associated-foods-complete flag removed:', updatedSabFood.food.flags);
    }
  }

  if (sabOptions.customPromptAnswers === false && updatedSabFood?.food?.customPromptAnswers) {
    updatedSabFood.food.customPromptAnswers = {};
    delete updatedSabFood.food.external;
    console.debug('Custom prompt answers and external food removed as SAB custom prompt answers checkbox is explicitly set to false');
  }
}

function sabAction(type: 'notSame' | 'same') {
  if (type === 'same' && updatedSabFood.food) {
    const { id, ...update } = updatedSabFood.food;
    survey.updateFood({
      foodId,
      update: {
        ...update,
        linkedFoods: update.linkedFoods?.map(linkedFood => ({
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
