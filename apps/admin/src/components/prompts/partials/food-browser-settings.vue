<template>
  <v-card border flat>
    <v-toolbar color="surface">
      <v-icon end icon="$search" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.foodBrowser._') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-label>{{ $t('survey-schemes.prompts.foodBrowser.categoriesFirst._') }}</v-label>
      <v-switch
        hide-details="auto"
        :label="$t('survey-schemes.prompts.foodBrowser.categoriesFirst.browse')"
        :model-value="categoriesFirst.browse"
        @update:model-value="updateCategoriesFirst('browse', $event)"
      />
      <v-switch
        hide-details="auto"
        :label="$t('survey-schemes.prompts.foodBrowser.categoriesFirst.search')"
        :model-value="categoriesFirst.search"
        @update:model-value="updateCategoriesFirst('search', $event)"
      />
      <v-switch
        v-model="allowThumbnails"
        hide-details="auto"
        :label="$t('survey-schemes.prompts.food-search-prompt.allowThumbnails')"
      />
      <v-switch
        v-model="enableGrid"
        hide-details="auto"
        :label="$t('survey-schemes.prompts.food-search-prompt.enableGrid')"
      />
      <v-slide-x-transition>
        <div v-show="enableGrid" class="ml-4">
          <v-label>
            {{ $t('survey-schemes.prompts.food-search-prompt.gridThreshold', { percent: Math.round(gridThreshold) }) }}
          </v-label>
          <v-slider
            v-model="gridThreshold"
            class="ml-0"
            :max-width="600"
            :min="10"
            :step="5"
          />
        </div>
      </v-slide-x-transition>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodBrowser } from '@intake24/common/prompts';

defineOptions({ name: 'FoodBrowserSettings' });

const categoriesFirst = defineModel('categoriesFirst', { type: Object as PropType<FoodBrowser['categoriesFirst']>, required: true });
const allowThumbnails = defineModel('allowThumbnails', { type: Boolean as PropType<FoodBrowser['allowThumbnails']>, required: true });
const enableGrid = defineModel('enableGrid', { type: Boolean as PropType<FoodBrowser['enableGrid']>, required: true });
const gridThreshold = defineModel('gridThreshold', { type: Number as PropType<FoodBrowser['gridThreshold']>, required: true });

function updateCategoriesFirst(field: keyof FoodBrowser['categoriesFirst'], value: boolean | null) {
  categoriesFirst.value = {
    ...categoriesFirst.value,
    [field]: Boolean(value),
  };
}
</script>

<style lang="scss" scoped></style>
