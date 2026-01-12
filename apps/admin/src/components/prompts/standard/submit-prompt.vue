<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <v-card-title>{{ $t('survey-schemes.prompts.submit-prompt.review.title') }}</v-card-title>
        <v-card-subtitle>
          {{ $t('survey-schemes.prompts.submit-prompt.review.subtitle') }}
        </v-card-subtitle>
        <v-card-text>
          <v-select
            v-for="key in keys"
            :key="key"
            :items="options"
            :label="$t(`survey-schemes.theme.layouts.${key}`)"
            :model-value="review[key]"
            :prepend-inner-icon="`$${key}`"
            variant="outlined"
            @update:model-value="update('review', { ...review, [key]: $event })"
          />
        </v-card-text>
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';
import { reviewOptions } from '@intake24/common/prompts';
import { useI18n } from '@intake24/ui';

import { basePrompt } from '../partials';

type Key = keyof Prompts['submit-prompt']['review'];

export default defineComponent({
  name: 'SubmitPrompt',

  mixins: [basePrompt],

  props: {
    review: {
      type: Object as PropType<Prompts['submit-prompt']['review']>,
      required: true,
    },
  },

  setup(props) {
    const { i18n } = useI18n();

    const options = reviewOptions.map(value => ({
      title: i18n.t(`survey-schemes.prompts.submit-prompt.review.${value}`),
      value,
    }));

    const keys = computed(() => Object.keys(props.review) as Key[]);

    return { keys, options };
  },
});
</script>

<style lang="scss" scoped></style>
