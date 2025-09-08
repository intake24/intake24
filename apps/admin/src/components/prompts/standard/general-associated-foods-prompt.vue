<template>
  <v-tabs-window-item value="options">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.categoryCode')"
            :model-value="categoryCode"
            @change="update('categoryCode', $event)"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
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
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
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
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.multiple')"
            :model-value="multiple"
            @update:model-value="update('multiple', $event)"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.general-associated-foods-prompt.skipPortionSize')"
            :model-value="skipPortionSize"
            @update:model-value="update('skipPortionSize', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <food-browser-settings
            v-bind="{ categoriesFirst, allowThumbnails, enableGrid, gridThreshold }"
            @update="update($event.field, $event.value)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { LanguageSelector } from '../../forms';
import { basePrompt, foodBrowserProps, FoodBrowserSettings } from '../partials';

export default defineComponent({
  name: 'GeneralAssociatedFoodsPrompt',

  components: { FoodBrowserSettings, LanguageSelector },

  mixins: [basePrompt, foodBrowserProps],

  props: {
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
    multiple: {
      type: Boolean as PropType<Prompts['general-associated-foods-prompt']['multiple']>,
      required: true,
    },
    skipPortionSize: {
      type: Boolean as PropType<Prompts['general-associated-foods-prompt']['skipPortionSize']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
