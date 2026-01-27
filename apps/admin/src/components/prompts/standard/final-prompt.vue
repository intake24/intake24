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
            @update:model-value="update('rating', $event)"
          />
        </v-card-text>
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'FinalPrompt',

  mixins: [basePrompt],

  props: {
    rating: {
      type: Boolean as PropType<Prompts['final-prompt']['rating']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
