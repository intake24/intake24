<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.food-search-prompt.allowBrowsing')"
          :model-value="allowBrowsing"
          @update:model-value="update('allowBrowsing', $event)"
        />
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.food-search-prompt.dualLanguage')"
          :model-value="dualLanguage"
          @update:model-value="update('dualLanguage', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <food-browser-settings
          v-bind="{ categoriesFirst, allowThumbnails, enableGrid, gridThreshold }"
          @update="update($event.field, $event.value)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { basePrompt, foodBrowserProps, FoodBrowserSettings } from '../partials';

export default defineComponent({
  name: 'FoodSearchPrompt',

  components: { FoodBrowserSettings },

  mixins: [basePrompt, foodBrowserProps],

  props: {
    allowBrowsing: {
      type: Boolean as PropType<Prompts['food-search-prompt']['allowBrowsing']>,
      required: true,
    },
    dualLanguage: {
      type: Boolean as PropType<Prompts['food-search-prompt']['dualLanguage']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
