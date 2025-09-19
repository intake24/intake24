<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12">
        <v-select
          hide-details="auto"
          :items="orientations"
          :label="$t('survey-schemes.prompts.orientation._')"
          :model-value="orientation"
          variant="outlined"
          @update:model-value="update('orientation', $event)"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.other')"
          :model-value="other"
          @update:model-value="update('other', $event)"
        />
      </v-col>
    </v-row>
    <language-selector
      border
      :default="[]"
      :label="$t('common.options.title')"
      :model-value="options"
      :required="true"
      @update:model-value="update('options', $event)"
    >
      <template v-for="lang in Object.keys(options)" :key="lang" #[`lang.${lang}`]>
        <options-list
          :options="options[lang]"
          @update:options="updateLanguage('options', lang, $event)"
        />
      </template>
    </language-selector>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import { useSelects } from '@intake24/admin/composables';
import type { Prompts } from '@intake24/common/prompts';

import { selectListPrompt } from '../partials';

export default defineComponent({
  name: 'RadioListPrompt',

  mixins: [selectListPrompt],

  props: {
    orientation: {
      type: String as PropType<Prompts['radio-list-prompt']['orientation']>,
      required: true,
    },
  },

  setup() {
    const { orientations } = useSelects();

    return { orientations };
  },
});
</script>

<style lang="scss" scoped></style>
