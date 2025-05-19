<template>
  <same-as-before-prompt
    v-if="sabFood"
    v-bind="{ food, meal, prompt, sabFood, section }"
    @action="action"
    @update:sab-options="onSabOptionsUpdate"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
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

interface SabOptions {
  [key: string]: boolean;
}
const sabOptions = ref<SabOptions>({});

function onSabOptionsUpdate(newSabOptions: SabOptions): void {
  console.debug('Received sabOptions from child:', newSabOptions);
  sabOptions.value = newSabOptions;
  // Remove portion size and portion size method if serving checkbox is false
  if (!sabOptions.value.serving && sabFood?.food?.portionSize) {
    sabFood.food.portionSize = null;
    sabFood.food.portionSizeMethodIndex = null;
    console.debug('sabFood.food.portionSize cleared');
    if (Array.isArray(sabFood.food.flags)) {
      sabFood.food.flags = sabFood.food.flags.filter(
        (flag: string) =>
          flag !== 'portion-size-option-complete'
          && flag !== 'portion-size-method-complete',
      );
      console.debug('Flags updated:', sabFood.food.flags);
    }
  }
  // Remove portion size if leftovers checkbox is false
  if (!sabOptions.value.leftovers && sabFood?.food?.portionSize) {
    sabFood.food.portionSize = null;
    console.debug('sabFood.food.portionSize cleared');
    if (Array.isArray(sabFood.food.flags)) {
      sabFood.food.flags = sabFood.food.flags.filter(
        (flag: string) =>
          flag !== 'portion-size-option-complete'
          && flag !== 'portion-size-method-complete',
      );
      console.debug('Flags updated:', sabFood.food.flags);
    }
  }
  // Keep or remove linked foods if checkbox for linked foods is false
  // loop through sabFood.food.linkedFoods, match id with the key of sabOptions.value
  // when a match is found, check if the value is false, if so, remove the linked food
  // when a match is found and the value is true, keep the linked food
  if (sabFood?.food?.linkedFoods) {
    sabFood.food.linkedFoods = sabFood.food.linkedFoods.filter(
      (linkedFood) => {
        const key = linkedFood.id;
        if (sabOptions.value[key] === false) {
          console.debug(`Removing linked food with id ${key} because checkbox is false`);
          return false; // Remove this linked food
        }
        console.debug(`Keeping linked food with id ${key} because checkbox is true`);
        return true; // Keep this linked food
      },
    );
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
