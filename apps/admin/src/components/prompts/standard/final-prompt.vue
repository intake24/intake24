<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <v-card-title>
          <v-icon icon="fas fa-star-half-stroke" start />
          {{ $t('survey-schemes.prompts.final-prompt.rating.title') }}
        </v-card-title>
        <v-card-text>
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.final-prompt.rating._')"
            :model-value="rating"
            @update:model-value="update('rating', !!$event)"
          />
        </v-card-text>
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useBasePrompt } from '../partials';

defineOptions({ name: 'FinalPrompt' });

const props = defineProps({
  rating: {
    type: Boolean as PropType<Prompts['final-prompt']['rating']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
