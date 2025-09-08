<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
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
import { defineComponent } from 'vue';

import { basePrompt, foodBrowserProps, FoodBrowserSettings } from '../partials';

export default defineComponent({
  name: 'RecipeBuilderFoodPrompt',

  components: { FoodBrowserSettings },

  mixins: [basePrompt, foodBrowserProps],
});
</script>

<style lang="scss" scoped></style>
