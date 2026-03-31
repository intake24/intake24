<template>
  <multi-prompt
    v-model="state"
    v-model:panel="panel"
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
import type { PropType } from 'vue';

import type { Prompt, Prompts } from '@intake24/common/prompts';
import type { CustomPromptAnswer, PromptSection } from '@intake24/common/surveys';

import { ref, watch } from 'vue';

import { MultiPrompt } from '@intake24/survey/components/prompts';
import { getOrCreatePromptStateStore, useSurvey } from '@intake24/survey/stores';
import { pushFullHistoryEntry } from '@intake24/survey/stores/recall-history';

import { useCustomPromptHandler } from '../composables';

const props = defineProps({
  prompt: {
    type: Object as PropType<Prompts['multi-prompt']>,
    required: true,
  },
  section: {
    type: String as PropType<PromptSection>,
    required: true,
  },
});

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

const promptStore = getOrCreatePromptStateStore<{ answers: (CustomPromptAnswer | undefined)[]; panel: number | undefined }>('multi-prompt')();

function getEntityId(): string {
  if (survey.selection.element?.type === 'food')
    return food.value?.id ?? '$survey';
  if (survey.selection.element?.type === 'meal')
    return meal.value?.id ?? '$survey';
  return '$survey';
}

const entityId = getEntityId();
const storedState = promptStore.prompts[entityId]?.[props.prompt.id];

const isInfoPrompt = (prompt: Prompt) => infoPrompts.includes(prompt.component);
const state = ref<(CustomPromptAnswer | undefined)[]>(
  storedState?.answers ?? props.prompt.prompts.map(prompt =>
    isInfoPrompt(prompt) ? 'next' : resolvePromptAnswer(prompt),
  ),
);
const panel = ref<number | undefined>(storedState ? storedState.panel : 0);

watch([state, panel], ([answers, panel]) => {
  promptStore.updateState(entityId, props.prompt.id, { answers, panel });
}, { deep: true });

function commitAnswer() {
  props.prompt.prompts.forEach((prompt, idx) => {
    commitPromptAnswer(prompt, state.value[idx]);
  });
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next') {
    pushFullHistoryEntry('multi-prompt');
    commitAnswer();
  }

  emit('action', type, ...args);
}
</script>

<style scoped></style>
