<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
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
        hide-details="auto"
        :label="$t('survey-schemes.prompts.food-search-prompt.allowThumbnails')"
        :model-value="allowThumbnails"
        @update:model-value="update('allowThumbnails', $event)"
      />
      <v-switch
        hide-details="auto"
        :label="$t('survey-schemes.prompts.food-search-prompt.enableGrid')"
        :model-value="enableGrid"
        @update:model-value="update('enableGrid', $event)"
      />
      <v-slide-x-transition>
        <div v-show="enableGrid" class="ml-4">
          <v-label>
            {{ $t('survey-schemes.prompts.food-search-prompt.gridThreshold', { percent: Math.round(gridThreshold) }) }}
          </v-label>
          <v-slider
            class="ml-0"
            :max-width="600"
            :min="10"
            :model-value="gridThreshold"
            :step="5"
            @update:model-value="update('gridThreshold', $event)"
          />
        </div>
      </v-slide-x-transition>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { FoodBrowser } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FoodBrowserSettings',

  props: {
    categoriesFirst: {
      type: Object as PropType<FoodBrowser['categoriesFirst']>,
      required: true,
    },
    allowThumbnails: {
      type: Boolean as PropType<FoodBrowser['allowThumbnails']>,
      required: true,
    },
    enableGrid: {
      type: Boolean as PropType<FoodBrowser['enableGrid']>,
      required: true,
    },
    gridThreshold: {
      type: Number as PropType<FoodBrowser['gridThreshold']>,
      required: true,
    },
  },

  emits: ['update'],

  methods: {
    update(field: keyof FoodBrowser, value: any) {
      this.$emit(`update`, { field, value });
    },
    updateCategoriesFirst(field: keyof FoodBrowser['categoriesFirst'], value: boolean | null) {
      this.$emit(`update`, { field: 'categoriesFirst', value: { ...this.categoriesFirst, [field]: Boolean(value) } });
    },
  },
});
</script>

<style lang="scss" scoped></style>
