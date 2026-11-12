<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.same-as-before-prompt.skipToSAB')"
          :model-value="skipToSAB"
          @update:model-value="update('skipToSAB', !!$event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useBasePrompt } from '../partials';

defineOptions({ name: 'SameAsBeforePrompt' });

const props = defineProps({
  skipToSAB: {
    type: Boolean as PropType<Prompts['same-as-before-prompt']['skipToSAB']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
