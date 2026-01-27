<template>
  <v-tabs-window-item value="options">
    <v-container>
      <v-row>
        <v-col class="d-flex flex-column gr-4" cols="12" md="6">
          <v-text-field
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.categoryCode')"
            :model-value="categoryCode"
            @update:model-value="update('categoryCode', $event)"
          />
          <language-selector
            :default="[]"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.promptText')"
            :model-value="promptText"
            @update:model-value="update('promptText', $event)"
          >
            <template v-for="lang in Object.keys(promptText)" :key="lang" #[`lang.${lang}`]>
              <v-text-field
                hide-details="auto"
                :model-value="promptText[lang]"
                :name="`promptText.${lang}`"
                variant="outlined"
                @update:model-value="updateLanguage('promptText', lang, $event)"
              />
            </template>
          </language-selector>
          <language-selector
            :default="[]"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.genericName')"
            :model-value="genericName"
            @update:model-value="update('genericName', $event)"
          >
            <template v-for="lang in Object.keys(genericName)" :key="lang" #[`lang.${lang}`]>
              <v-text-field
                hide-details="auto"
                :model-value="genericName[lang]"
                :name="`genericName.${lang}`"
                variant="outlined"
                @update:model-value="updateLanguage('genericName', lang, $event)"
              />
            </template>
          </language-selector>
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.multiple')"
            :model-value="multiple"
            @update:model-value="update('multiple', $event)"
          />
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.skipPortionSize')"
            :model-value="skipPortionSize"
            @update:model-value="update('skipPortionSize', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <food-browser-settings
            v-bind="{ categoriesFirst, allowThumbnails, enableGrid, gridThreshold }"
            @update="update($event.field, $event.value)"
          />
        </v-col>
        <v-col cols="12">
          <food-search-hints
            :model-value="hints"
            @update:model-value="update('hints', $event)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { LanguageSelector } from '../../forms';
import { foodBrowserProps, FoodBrowserSettings, FoodSearchHints, useBasePrompt } from '../partials';

const props = defineProps({
  ...foodBrowserProps,
  categoryCode: {
    type: String as PropType<Prompts['general-associated-foods-prompt']['categoryCode']>,
    required: true,
  },
  promptText: {
    type: Object as PropType<Prompts['general-associated-foods-prompt']['promptText']>,
    required: true,
  },
  genericName: {
    type: Object as PropType<Prompts['general-associated-foods-prompt']['genericName']>,
    required: true,
  },
  hints: {
    type: Array as PropType<Prompts['general-associated-foods-prompt']['hints']>,
    required: true,
  },
  multiple: {
    type: Boolean as PropType<Prompts['general-associated-foods-prompt']['multiple']>,
    required: true,
  },
  skipPortionSize: {
    type: Boolean as PropType<Prompts['general-associated-foods-prompt']['skipPortionSize']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update, updateLanguage } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
