<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <component :is="prompt.source.type" v-bind="{ food, prompt, modelValue }" @update:model-value="select" />
    <template #actions>
      <v-btn
        :title="promptI18n.missing"
        @click="action('missing')"
      >
        <v-icon icon="$no" start />
        {{ promptI18n.missing }}
      </v-btn>
      <template v-if="modelValue.data">
        <v-spacer v-if="!$vuetify.display.mobile" />
        <next :disabled="!isValid" :label="promptI18n.select" @click="action('next')" />
      </template>
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PromptStates } from '@intake24/common/prompts';
import type { FoodState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';
import externalSources from './external-sources';

defineOptions({ components: { ...externalSources } });

const props = defineProps({
  ...createBasePromptProps<'external-source-prompt', FoodState>(),
  food: {
    type: Object as PropType<FoodState>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<PromptStates['external-source-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, translatePrompt } = usePromptUtils(props, { emit });

const isValid = computed(() => !!props.modelValue);
const promptI18n = computed(() => translatePrompt(['select', 'missing']));

function select(data: PromptStates['external-source-prompt']) {
  emit('update:modelValue', data);
}
</script>

<style lang="scss" scoped></style>
