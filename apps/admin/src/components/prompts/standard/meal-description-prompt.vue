<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2">
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.meal-description-prompt.reviewFoods')"
          :messages="$t('survey-schemes.prompts.meal-description-prompt.reviewFoodsHint')"
          :model-value="reviewFoods"
          name="reviewFoods"
          @update:model-value="update('reviewFoods', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-number-input
          hide-details="auto"
          :label="$t('survey-schemes.prompts.meal-description-prompt.timeout')"
          :messages="$t('survey-schemes.prompts.meal-description-prompt.timeoutHint')"
          :min="1"
          :model-value="timeout"
          name="timeout"
          variant="outlined"
          @update:model-value="update('timeout', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useBasePrompt } from '../partials';

const props = defineProps({
  reviewFoods: {
    type: Boolean as PropType<Prompts['meal-description-prompt']['reviewFoods']>,
    required: true,
  },
  timeout: {
    type: Number as PropType<Prompts['meal-description-prompt']['timeout']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
