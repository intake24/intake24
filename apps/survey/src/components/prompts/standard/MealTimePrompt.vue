<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text class="pt-2">
      <component
        :is="`time-picker-${prompt.ui}`"
        v-model="state"
        :prompt="prompt"
      />
    </v-card-text>
    <template #actions>
      <v-btn
        :title="promptI18n.no"
        @click.stop="action('cancel')"
      >
        {{ promptI18n.no }}
      </v-btn>
      <v-btn
        :title="promptI18n.yes"
        variant="flat"
        @click.stop="action('next')"
      >
        {{ promptI18n.yes }}
      </v-btn>
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { fromTime, toTime } from '@intake24/common/util';
import { timePickers } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { createMealPromptProps } from '../prompt-props';

defineOptions({
  components: { ...timePickers },
});

const props = defineProps(createMealPromptProps<'meal-time-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

const { action, translatePrompt } = usePromptUtils(props, { emit });

const promptI18n = computed(() => translatePrompt(['no', 'yes']));
const state = computed({
  get() {
    return fromTime(props.modelValue);
  },
  set(value) {
    emit('update:modelValue', toTime(value));
  },
});
const isValid = computed(() => !!state.value);
</script>

<style lang="scss">
</style>
