<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.multiple._')"
          :model-value="multiple"
          @update:model-value="update('multiple', $event)"
        />
      </v-col>
    </v-row>
    <language-selector
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

import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';
import type { Prompts } from '@intake24/common/prompts';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'SelectPrompt',

  components: { OptionsList, LanguageSelector },

  mixins: [basePrompt],

  props: {
    multiple: {
      type: Boolean as PropType<Prompts['select-prompt']['multiple']>,
      required: true,
    },
    options: {
      type: Object as PropType<Prompts['select-prompt']['options']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
