<template>
  <meal-add-prompt
    v-model="state"
    v-bind="{ defaultMeals, meals, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { MealAddPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';
import { useI18n } from '@intake24/ui';
import { createHandlerProps, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'meal-add-prompt'>());

const emit = defineEmits(['action']);

const getInitialState = computed<string | undefined>(() => undefined);

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);
const { i18n: { locale } } = useI18n();
const survey = useSurvey();

const defaultMeals = computed(() => survey.defaultSchemeMeals?.map(({ name }) => name[locale.value] ?? name.en) ?? []);
const meals = computed(() => survey.meals.map(({ name }) => (name[locale.value] ?? name.en).toLowerCase().trim()));

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  if (type === 'cancel') {
    survey.setAutoSelection();
    type = 'next';
  }

  emit('action', type, ...args);
}

function commitAnswer() {
  if (!state.value) {
    console.warn('MealAddPromptHandler: no meal selected');
    survey.setAutoSelection();
    return;
  }

  survey.addMeal({ name: { en: state.value, [locale.value]: state.value } }, locale.value);
}
</script>
