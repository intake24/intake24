<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.panel" :tile="$vuetify.display.mobile">
      <v-expansion-panel v-for="(item, idx) in times" :key="idx">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.sleepSchedule.${item}`" tag="span" />
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-column align-center gr-4">
            <component
              :is="`time-picker-${prompt.ui}`"
              v-model="state.schedule[item]"
              :prompt="prompt"
            />
            <v-btn class="px-16" color="primary" @click="nextPanel">
              {{ $t('prompts.sleepSchedule.confirm') }}
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PromptStates } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

import { timePickers } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import { usePanel } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  components: { ...timePickers },
});

const props = defineProps({
  ...createBasePromptProps<'sleep-schedule-prompt'>(),
  modelValue: {
    type: Object as PropType<PromptStates['sleep-schedule-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action } = usePromptUtils(props, { emit });

const state = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
const times = ['wakeUp', 'sleep'] as const;

const validConditions = computed(() => [!!state.value.schedule.wakeUp, !!state.value.schedule.sleep]);
const isValid = computed(() => validConditions.value.every(condition => condition));

usePanel(state, validConditions);

function nextPanel() {
  const panels = validConditions.value.length;
  if (state.value.panel >= panels - 1 && isValid.value) {
    action('next');
    return;
  }

  state.value.panel = state.value.panel < panels - 1 ? state.value.panel + 1 : 0;
};
</script>

<style lang="scss">
</style>
