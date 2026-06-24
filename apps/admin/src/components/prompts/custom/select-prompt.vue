<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12">
        <v-switch
          :disabled="updateFood"
          hide-details="auto"
          :label="$t('survey-schemes.prompts.multiple._')"
          :model-value="multiple"
          @update:model-value="update('multiple', $event)"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          v-if="showUpdateFoodSwitch"
          :disabled="!canUseUpdateFood"
          hide-details="auto"
          :label="$t('survey-schemes.prompts.updateFood')"
          :model-value="updateFood"
          @update:model-value="update('updateFood', $event)"
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
          :update-food="updateFood"
          @update:options="updateLanguage('options', lang, $event)"
        />
      </template>
    </language-selector>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';

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
    updateFood: {
      type: Boolean as PropType<Prompts['select-prompt']['updateFood']>,
      required: true,
    },
    validation: {
      type: Object as PropType<Prompts['select-prompt']['validation']>,
      required: true,
    },
    promptSection: {
      type: String as PropType<PromptSection | undefined>,
      default: undefined,
    },
    options: {
      type: Object as PropType<Prompts['select-prompt']['options']>,
      required: true,
    },
  },

  computed: {
    validationRequired(): boolean {
      return this.validation.required;
    },
    showUpdateFoodSwitch(): boolean {
      return this.promptSection === 'foods';
    },
    canUseUpdateFood(): boolean {
      return this.showUpdateFoodSwitch && this.validationRequired && !this.multiple;
    },
  },

  watch: {
    canUseUpdateFood: {
      immediate: true,
      handler(value: boolean) {
        if (!value && this.updateFood)
          this.update('updateFood', false);
      },
    },
    updateFood(value: boolean) {
      if (value && this.multiple)
        this.update('multiple', false);
    },
    multiple(value: boolean) {
      if (value && this.updateFood)
        this.update('updateFood', false);
    },
  },
});
</script>

<style lang="scss" scoped></style>
