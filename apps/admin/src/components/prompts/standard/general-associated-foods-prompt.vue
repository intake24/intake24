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
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.autoPortionSize')"
            :model-value="autoPortionSize !== null"
            @update:model-value="update('autoPortionSize', $event ? { mode: 'weight', value: 0 } : null)"
          />
          <template v-if="autoPortionSize !== null">
            <v-select
              hide-details="auto"
              :items="autoPortionSizeModeItems"
              :label="$t('survey-schemes.prompts.general-associated-foods-prompt.autoPortionSizeMode')"
              :model-value="autoPortionSize.mode"
              @update:model-value="update('autoPortionSize', { ...autoPortionSize, mode: $event })"
            />
            <v-text-field
              hide-details="auto"
              :label="$t('survey-schemes.prompts.general-associated-foods-prompt.autoPortionSizeValue')"
              :model-value="autoPortionSize.value"
              type="number"
              @update:model-value="update('autoPortionSize', { ...autoPortionSize, value: Number($event) })"
            />
          </template>
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

import { autoPsmModes } from '@intake24/common/surveys/portion-size';
import { useI18n } from '@intake24/ui';

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
  autoPortionSize: {
    type: Object as PropType<Prompts['general-associated-foods-prompt']['autoPortionSize']>,
    default: null,
  },
});

const emit = defineEmits(['update:options']);

const { i18n: { t } } = useI18n();

const { update, updateLanguage } = useBasePrompt(props, { emit });

const autoPortionSizeModeItems = autoPsmModes.map(value => ({
  value,
  title: t(`fdbs.portionSizes.methods.auto.modes.${value}`),
}));
</script>

<style lang="scss" scoped></style>
