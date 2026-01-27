<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <v-card-text class="pt-2">
      <component
        :is="`time-picker-${prompt.ui}`"
        v-model="state"
        :prompt="prompt"
      />
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed } from 'vue';

import { timePickers } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'TimePickerPrompt',
  components: { BaseLayout, CardLayout, PanelLayout, ...timePickers },
});

const props = defineProps({
  ...createBasePromptProps<'time-picker-prompt'>(),
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, customPromptLayout } = usePromptUtils(props, { emit });
const state = defineModel('modelValue', { type: String as PropType<string | null>, default: null });
const isValid = computed(() => !props.prompt.validation.required || !!state.value);

defineExpose({ isValid });
</script>

<style lang="scss">
</style>
