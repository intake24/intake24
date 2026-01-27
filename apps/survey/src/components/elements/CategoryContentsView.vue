<template>
  <div class="d-flex flex-column gr-4">
    <v-alert
      v-if="!contents.subcategories.length && !contents.foods.length"
      border="start"
      density="compact"
      icon="fas fa-lightbulb"
      type="warning"
    >
      {{ i18n.none }}
    </v-alert>
    <v-alert
      v-if="containsPizza"
      border="start"
      density="compact"
      icon="fas fa-lightbulb"
      rounded="lg"
      type="warning"
    >
      {{ i18n.pizza }}
    </v-alert>
    <v-alert
      v-if="contents.foods.length >= 50 && type === 'foodSearch'"
      border="start"
      density="compact"
      icon="fas fa-wrench"
      rounded="lg"
      type="warning"
    >
      {{ i18n.refine }}
    </v-alert>
    <v-chip-group
      v-if="contents.subcategories.length"
      class="text-primary py-0"
      color="primary"
      column
      variant="outlined"
    >
      <v-chip
        v-for="category in showAll ? contents.subcategories : firstCategories"
        :key="category.code"
        class="chip__no-wrap py-1"
        clickable
        @click="categorySelected(category)"
      >
        <span class="font-weight-medium">{{ category.name }}</span>
      </v-chip>
    </v-chip-group>
    <v-btn
      v-if="contents.subcategories.length > threshold"
      color="primary"
      variant="outlined"
      @click="showAll = !showAll"
    >
      {{ showAll ? i18n.showLess : i18n.showAll }}
    </v-btn>

    <v-row v-if="useGridLayout && contents.foods.length">
      <v-col
        v-for="food in contents.foods"
        :key="food.code"
        cols="12"
        lg="4"
        sm="6"
        @click="foodSelected(food)"
      >
        <v-card border class="h-100 food-thumbnail-card">
          <v-card-text>
            <v-img
              v-if="allowThumbnails && food.thumbnailImageUrl"
              aspect-ratio="1"
              :src="food.thumbnailImageUrl"
            />
            <no-image-placeholder v-else />
          </v-card-text>
          <v-card-title class="text-wrap font-weight-medium">
            {{ food.name }}
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-list v-if="!useGridLayout && contents.foods.length" class="list__no-wrap py-0" slim>
      <div
        v-for="food in contents.foods"
        :key="food.code"
        class="border-bottom"
      >
        <v-list-item
          class="cursor-pointer"
          @click="foodSelected(food)"
        >
          <template #prepend>
            <v-icon icon="$food" />
          </template>
          <v-list-item-title>{{ food.name }}</v-list-item-title>

          <template #append>
            <v-btn
              v-if="allowThumbnails && food.thumbnailImageUrl"
              icon
              @click.stop="toggleFoodThumbnail(food.code)"
            >
              <v-icon icon="$image" />
            </v-btn>
          </template>
        </v-list-item>
        <v-expand-transition>
          <v-card
            v-show="allowThumbnails && food.thumbnailImageUrl && thumbnailExpanded[food.code]"
            border class="ma-4 mt-2 cursor-pointer" max-width="80%" @click="foodSelected(food)"
          >
            <v-card-text class="pa-1">
              <v-img
                eager
                :src="food.thumbnailImageUrl"
                @click.stop
              />
            </v-card-text>
          </v-card>
        </v-expand-transition>
      </div>
    </v-list>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { CategoryContents, CategoryHeader, FoodHeader } from '@intake24/common/types/http';

import { defineComponent, reactive } from 'vue';

import { sendGtmEvent } from '@intake24/survey/util';

import NoImagePlaceholder from './NoImagePlaceholder.vue';

export default defineComponent({
  name: 'CategoryContentsView',

  components: { NoImagePlaceholder },

  props: {
    contents: {
      type: Object as PropType<CategoryContents>,
      required: true,
    },
    i18n: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
    categoriesFirst: {
      type: Boolean,
      default: true,
    },
    searchTerm: {
      type: String as PropType<string>,
      default: '',
    },
    type: {
      type: String as PropType<string>,
      default: '',
    },
    allowThumbnails: {
      type: Boolean,
      required: true,
    },
    enableGrid: {
      type: Boolean,
      required: true,
    },
    gridThreshold: {
      type: Number,
      required: true,
    },
    searchCount: {
      type: Number as PropType<number>,
      default: 0,
    },
    percentScrolled: {
      type: Number as PropType<number>,
      default: 0,
    },
  },

  emits: ['foodSelected', 'categorySelected'],

  data() {
    return {
      expanded: false,
      showAll: false,
      threshold: 0,
      thumbnailExpanded: reactive<Record<string, boolean>>({}),
    };
  },

  computed: {
    firstCategories(): CategoryHeader[] {
      return this.contents.subcategories.slice(0, this.threshold);
    },
    remainingCategories(): CategoryHeader[] {
      return this.contents.subcategories.slice(this.threshold);
    },
    containsPizza(): boolean | null {
      return this.searchTerm.toLowerCase().includes('pizza');
    },
    useGridLayout(): boolean {
      if (!(this.enableGrid && this.allowThumbnails))
        return false;

      const totalFoodCount = this.contents.foods.length;
      const foodsWithThumbnailsCount = this.contents.foods.filter(f => f.thumbnailImageUrl).length;

      if (totalFoodCount === 0)
        return false;
      else
        return Math.round(foodsWithThumbnailsCount * 100.0 / totalFoodCount) >= this.gridThreshold;
    },
  },

  watch: {
    'contents.foods.length': {
      handler(newLength) {
        if (newLength === 0) {
          this.showAll = true;
        }
      },
      immediate: true,
    },
  },

  methods: {
    categorySelected(category: CategoryHeader): void {
      this.$emit('categorySelected', category);
      sendGtmEvent({
        event: 'selectFoodCategory',
        scheme_prompts: 'foods',
        food_category: category.name,
        search_term: this.searchTerm,
        search_count: this.searchCount,
        percent_scrolled: this.percentScrolled,
      });
    },

    foodSelected(food: FoodHeader): void {
      this.$emit('foodSelected', food);
      sendGtmEvent({
        event: 'selectFood',
        scheme_prompts: 'foods',
        food: food.name,
        search_term: this.searchTerm,
        search_count: this.searchCount,
        percent_scrolled: this.percentScrolled,
      });
    },

    toggleExpand() {
      this.expanded = !this.expanded;
    },

    toggleFoodThumbnail(foodCode: string) {
      this.thumbnailExpanded[foodCode] = !this.thumbnailExpanded[foodCode];
    },
  },
});
</script>

<style scoped>
.border-bottom:not(:last-child) {
  border-bottom: 1px solid #eee;
}
.food-thumbnail-card {
  cursor: pointer;
}
</style>
