<template>
  <base-layout
    v-bind="{ food, meal, prompt: prompt.prompts[panel ?? 0], section, isValid }"
    @action="action"
  >
    <v-expansion-panels v-model="panel" :tile="$vuetify.display.mobile">
      <component
        :is="item.component"
        v-for="(item, idx) in prompt.prompts"
        :key="`${idx}-${restoreKey}`"
        v-bind="{
          meal,
          food,
          prompt: item,
          section,
        }"
        ref="promptRefs"
        v-model="state[idx]"
        @action="updatePanel(item, idx)"
      />
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { CustomPrompts } from './custom';
import type { Prompt } from '@intake24/common/prompts';
import type { CustomPromptAnswer, FoodState } from '@intake24/common/surveys';

import { computed, onBeforeUnmount, ref, toRaw, useTemplateRef } from 'vue';

import { copy } from '@intake24/common/util';
import { usePromptUtils } from '@intake24/survey/composables';
import { pushMultiPromptHistoryEntry, registerPromptHistoryHandler, setInsideMultiPrompt, unregisterPromptHistoryHandler } from '@intake24/survey/stores';

import { customPrompts } from './custom';
import { BaseLayout } from './layouts';
import { Next, useScrollToPanel } from './partials';
import { createBasePromptProps } from './prompt-props';

defineOptions({
  name: 'MultiPrompt',
  components: { ...customPrompts },
});

const props = defineProps({
  ...createBasePromptProps<'multi-prompt', FoodState>(),
  modelValue: {
    type: Array as PropType<(CustomPromptAnswer | undefined)[]>,
    required: true,
  },
  panel: {
    type: [Number] as PropType<number | undefined>,
  },
});

const emit = defineEmits(['action', 'update:modelValue', 'update:panel']);

const { action } = usePromptUtils(props, { emit });
const promptRefs = useTemplateRef<InstanceType<CustomPrompts>[]>('promptRefs');

const panel = computed<number | undefined>({
  get: () => props.panel,
  set: value => emit('update:panel', value),
});
useScrollToPanel(panel);

const state = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

// Forces sub-prompt remount on history restore (sub-prompts don't react to external modelValue changes)
// This breaks the panel expansion animation which is not straightforward to fix, but only happens
// on back/forward so left as is.
const restoreKey = ref(0);
const isValid = computed(() => promptRefs.value?.every(prompt => prompt.isValid));

function isAnswerRequired(prompt: Prompt) {
  return !('validation' in prompt) || prompt.validation.required;
}

setInsideMultiPrompt(true);

registerPromptHistoryHandler(
  () => copy(toRaw({ panel: panel.value, answers: state.value })),
  (restored) => {
    const { panel: restoredPanel, answers } = restored as { panel: number | undefined; answers: typeof state.value };
    panel.value = restoredPanel;
    state.value = answers;
    restoreKey.value++;
  },
);

onBeforeUnmount(() => {
  setInsideMultiPrompt(false);
  unregisterPromptHistoryHandler();
});

function updatePanel(prompt: Prompt, idx: number) {
  pushMultiPromptHistoryEntry(`multi-prompt panel ${idx}`);

  if (state.value[idx] === undefined && !isAnswerRequired(prompt))
    state.value[idx] = null;

  for (const [index, answer] of Object.entries(props.modelValue)) {
    if (answer === undefined) {
      panel.value = Number.parseInt(index);
      return;
    }
  }

  panel.value = undefined;
}
</script>

<style lang="scss"></style>
