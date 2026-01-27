<template>
  <component
    :is="prompt.component"
    :key="prompt.id"
    v-model="state"
    v-bind="{
      meal: mealOptional,
      food: foodOptional,
      prompt,
      section,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';

import { computed } from 'vue';

import { customPrompts } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';
import { flagPromptCompletionFlag } from '@intake24/survey/util';

import { useCustomPromptHandler } from '../composables/use-custom-prompt-handler';
import { usePromptHandlerNoStore } from '../composables/use-prompt-handler-no-store';

defineOptions({
  name: 'YesNoPromptHandler',
  components: { ...customPrompts },
});

const props = defineProps({
  prompt: {
    type: Object as PropType<Prompts['yes-no-prompt']>,
    required: true,
  },
  section: {
    type: String as PropType<PromptSection>,
    required: true,
  },
});

const emit = defineEmits(['action']);

const { foodOptional, mealOptional }
  = useCustomPromptHandler(props);
const survey = useSurvey();

function getFlagInitialState(flag: string, flags: string[]): boolean | null {
  return flags.includes(flagPromptCompletionFlag(flag)) ? flags.includes(flag) : null;
}

const getInitialState = computed(() => {
  if (survey.selection.element === null) {
    return (props.prompt.useFlag && props.prompt.flag)
      ? getFlagInitialState(props.prompt.flag, survey.data.flags)
      : survey.data.customPromptAnswers[props.prompt.id];
  }
  else {
    switch (survey.selection.element.type) {
      case 'food':
        return (props.prompt.useFlag && props.prompt.flag)
          ? getFlagInitialState(props.prompt.flag, foodOptional.value!.flags) // No clever way to handle food/meal being null here
          : foodOptional.value!.customPromptAnswers[props.prompt.id];
      case 'meal':
        return (props.prompt.useFlag && props.prompt.flag)
          ? getFlagInitialState(props.prompt.flag, mealOptional.value!.flags)
          : mealOptional.value!.customPromptAnswers[props.prompt.id];
    }
  }
  // ESLint complains about no return value, TSC complains about unreachable code T_T
  return false;
});

// TODO: use store for intermediate state
const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function commitAnswer() {
  if (survey.selection.element === null) {
    if (props.prompt.useFlag && props.prompt.flag) {
      survey.addFlag(flagPromptCompletionFlag(props.prompt.flag));
      if (state.value)
        survey.addFlag(props.prompt.flag);
      else
        survey.removeFlag(props.prompt.flag);
    }
    else {
      survey.setCustomPromptAnswer({ promptId: props.prompt.id, answer: state.value });
    }
  }
  else {
    switch (survey.selection.element.type) {
      case 'food':
        if (props.prompt.useFlag && props.prompt.flag) {
          survey.addFoodFlag(foodOptional.value!.id, flagPromptCompletionFlag(props.prompt.flag));
          if (state.value)
            survey.addFoodFlag(foodOptional.value!.id, props.prompt.flag);
          else
            survey.removeFoodFlag(foodOptional.value!.id, props.prompt.flag);
        }
        else {
          survey.setFoodCustomPromptAnswer({ foodId: foodOptional.value!.id, promptId: props.prompt.id, answer: state.value });
        }
        break;
      case 'meal':
        if (props.prompt.useFlag && props.prompt.flag) {
          survey.addMealFlag(mealOptional.value!.id, flagPromptCompletionFlag(props.prompt.flag));
          if (state.value)
            survey.addMealFlag(mealOptional.value!.id, props.prompt.flag);
          else
            survey.removeMealFlag(mealOptional.value!.id, props.prompt.flag);
        }
        else {
          survey.setMealCustomPromptAnswer({ mealId: mealOptional.value!.id, promptId: props.prompt.id, answer: state.value });
        }
        break;
    }
  }
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}
</script>

<style scoped></style>
