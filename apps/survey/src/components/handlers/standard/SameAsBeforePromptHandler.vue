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

function onSabOptionsUpdate(sabOptions: Record<string, boolean>): void {
  console.debug('Received sabOptions from child:', sabOptions);
  if (!sabOptions.serving && sabFood?.food?.portionSize) {
    sabFood.food.portionSize = null;
    sabFood.food.portionSizeMethodIndex = null;
    console.debug('Portion size and method are removed as SAB serving checkbox being false');

    if (Array.isArray(sabFood.food.flags)) {
      sabFood.food.flags = sabFood.food.flags.filter(
        (flag: string) =>
          flag !== 'portion-size-option-complete'
          && flag !== 'portion-size-method-complete',
      );
      console.debug('Flags updated:', sabFood.food.flags);
    }
  }
  if (!sabOptions.leftovers && sabFood?.food?.portionSize) {
    console.debug('Removing portion size due to SAB leftovers checkbox being false');
    sabFood.food.portionSize = null;
    if (Array.isArray(sabFood.food.flags)) {
      sabFood.food.flags = sabFood.food.flags.filter(
        (flag: string) =>
          flag !== 'portion-size-option-complete'
          && flag !== 'portion-size-method-complete',
      );
      console.debug('portion-size-option-complete and portion-size-method-complete flags removed:', sabFood.food.flags);
    }
  }
  if (sabFood?.food?.linkedFoods) {
    console.debug('Removing linked foods if is explicitly unchecked in SAB options');
    const numberOfLinkedFood = sabFood.food.linkedFoods.length;

    sabFood.food.linkedFoods = sabFood.food.linkedFoods.filter(
      linkedFood => !(sabOptions[linkedFood.id] === false),
    );
    console.debug('Linked foods updated:', sabFood.food.linkedFoods);
    if (sabFood.food.linkedFoods.length < numberOfLinkedFood && Array.isArray(sabFood.food.flags)) {
      sabFood.food.flags = sabFood.food.flags.filter(
        (flag: string) => flag !== 'associated-foods-complete',
      );
      console.debug('associated-foods-complete flag removed:', sabFood.food.flags);
    }
  }
  if (sabOptions.customPromptAnswers === false && sabFood?.food?.customPromptAnswers) {
    sabFood.food.customPromptAnswers = {};
    console.debug('Custom prompt answers removed as SAB custom prompt answers checkbox is explicitly set to false');
  }
}
function sabAction(type: 'notSame' | 'same') {
  if (type === 'same' && sabFood) {
    const { id, ...update } = sabFood.food;
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
