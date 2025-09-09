<template>
  <multi-prompt
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
import { ref } from 'vue';
import type { Prompt, Prompts } from '@intake24/common/prompts';
import type { CustomPromptAnswer, PromptSection } from '@intake24/common/surveys';
import { MultiPrompt } from '@intake24/survey/components/prompts';
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

const { commitPromptAnswer, resolvePromptAnswer, foodOptional, mealOptional }
  = useCustomPromptHandler(props);

const isInfoPrompt = (prompt: Prompt) => infoPrompts.includes(prompt.component);
const state = ref<(CustomPromptAnswer | undefined)[]>(
  props.prompt.prompts.map(prompt =>
    isInfoPrompt(prompt) ? 'next' : resolvePromptAnswer(prompt),
  ),
);

function commitAnswer() {
  props.prompt.prompts.forEach((prompt, idx) => {
    commitPromptAnswer(prompt, state.value[idx]);
  });
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}
</script>

<style scoped></style>
