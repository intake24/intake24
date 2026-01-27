<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2" dense>
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.yes-no-prompt.useFlag')"
          :model-value="useFlag"
          @update:model-value="update('useFlag', $event)"
        />
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-show="useFlag" class="ml-2" dense>
        <v-col cols="12" md="6">
          <v-text-field :label="$t('survey-schemes.prompts.yes-no-prompt.flag')" :model-value="flag" @update:model-value="update('flag', $event)" />
        </v-col>
      </v-row>
    </v-expand-transition>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'YesNoPrompt',

  mixins: [basePrompt],

  props: {
    useFlag: {
      type: Boolean as PropType<Prompts['yes-no-prompt']['useFlag']>,
      required: true,
    },
    flag: {
      type: String as PropType<Prompts['yes-no-prompt']['flag']>,
      required: false,
    },
  },
});
</script>

<style lang="scss" scoped></style>
