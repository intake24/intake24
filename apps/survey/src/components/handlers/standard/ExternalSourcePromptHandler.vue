<template>
  <external-source-prompt
    v-bind="{ food, meal, prompt, section }"
    v-model="state"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PromptStates } from '@intake24/common/prompts';
import { getSearchTerm } from '@intake24/common/surveys';
import { ExternalSourcePrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'external-source-prompt'>());

const emit = defineEmits(['action']);

const { food } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const getInitialState = computed<PromptStates['external-source-prompt']>(() => ({
  searchTerm: props.prompt.initialSearch === 'searchTerm' ? getSearchTerm(food.value) : null,
  type: undefined,
  data: undefined,
}));

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function commitAnswer() {
  const survey = useSurvey();
  const foodEntry = food.value;

  survey.updateFood({ foodId: foodEntry.id, update: {
    external: { ...foodEntry.external, [props.prompt.source.type]: state.value },
  } });
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (!['next', 'missing'].includes(type)) {
    emit('action', type, ...args);
    return;
  }

  state.value.type = type === 'next' ? 'selected' : 'missing';

  commitAnswer();
  emit('action', 'next');
}
</script>
