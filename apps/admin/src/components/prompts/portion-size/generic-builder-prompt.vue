<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <food-browser-settings
          v-bind="{ categoriesFirst, allowThumbnails, enableGrid, gridThreshold }"
          @update:allow-thumbnails="update('allowThumbnails', $event)"
          @update:categories-first="update('categoriesFirst', $event)"
          @update:enable-grid="update('enableGrid', $event)"
          @update:grid-threshold="update('gridThreshold', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import { foodBrowserProps, FoodBrowserSettings, useBasePrompt } from '../partials';

const props = defineProps(foodBrowserProps);

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
