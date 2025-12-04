<template>
  <same-as-before-prompt
    v-if="sabFood"
    v-bind="{ food, meal, prompt, sabFood, section }"
    @action="action"
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

// Only get SAB item if current food has sameAsBeforeOption enabled
const sabFood = food.value.data.sameAsBeforeOption
  ? useSameAsBefore().getItem(survey.localeId, code)
  : undefined;

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
