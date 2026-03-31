<template>
  <component
    :is="prompt.component"
    :key="prompt.id"
    v-model="state"
    v-bind="{
      meal,
      food,
      parentFood,
      prompt,
      section,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { CustomPromptAnswer } from '@intake24/common/surveys';

import { computed, ref, watch } from 'vue';

import { customPrompts } from '@intake24/survey/components/prompts';
import { getOrCreatePromptStateStore, useSurvey } from '@intake24/survey/stores';
import { pushFullHistoryEntry } from '@intake24/survey/stores/recall-history';

import { createHandlerProps, useCustomPromptHandler } from '../composables';

defineOptions({ components: { ...customPrompts } });

const props = defineProps(createHandlerProps());

const emit = defineEmits(['action']);

const infoPrompts = ['info-prompt'];

const {
  commitPromptAnswer,
  resolvePromptAnswer,
  foodOptional: food,
  mealOptional: meal,
  parentFoodOptional: parentFood,
}
  = useCustomPromptHandler(props);
const survey = useSurvey();

const promptStore = getOrCreatePromptStateStore<{ value: CustomPromptAnswer }>(props.prompt.component)();

function getEntityId(): string {
  if (survey.selection.element?.type === 'food')
    return food.value?.id ?? '$survey';
  if (survey.selection.element?.type === 'meal')
    return meal.value?.id ?? '$survey';
  return '$survey';
}

const entityId = getEntityId();
const storedState: CustomPromptAnswer | undefined = promptStore.prompts[entityId]?.[props.prompt.id]?.value;

const isInfoPrompt = computed(() => infoPrompts.includes(props.prompt.component));
const state = ref<CustomPromptAnswer | undefined>(
  isInfoPrompt.value ? 'next' : (storedState ?? resolvePromptAnswer(props.prompt)),
);

if (!isInfoPrompt.value) {
  watch(state, (value) => {
    if (value !== undefined)
      promptStore.updateState(entityId, props.prompt.id, { value });
  });
}

function commitAnswer() {
  if (props.prompt.component === 'no-more-information-prompt') {
    const newSelection = survey.selection;
    newSelection.mode = 'auto';
    survey.setSelection(newSelection);
  }

  commitPromptAnswer(props.prompt, state.value);
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next' || isInfoPrompt.value) {
    pushFullHistoryEntry(props.prompt.component);
    commitAnswer();
  }

  emit('action', type, ...args);
}
</script>

<style scoped></style>
