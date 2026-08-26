<template>
  <v-card>
    <v-card-title class="pa-4 d-flex flex-row align-center ga-4">
      <v-badge bordered color="primary" :content="foodCount" location="top right">
        <v-icon icon="fas fa-list-check" />
      </v-badge>
      {{ $t('recall.menu.title') }}
    </v-card-title>
    <v-divider />
    <v-list class="meal-list__list pt-0" density="compact" tile>
      <component
        :is="expandable ? 'meal-item-expandable' : 'meal-item'"
        v-for="meal in meals"
        :key="meal.id"
        v-bind="{ meal, selectedMealId, selectedFoodId }"
        :selected-food-in-meal="isSelectedFoodInMeal(meal.id)"
        @action="action"
      />
    </v-list>
    <v-card-actions>
      <v-btn
        block
        color="primary"
        :title="$t('recall.menu.food.add')"
        variant="tonal"
        @click="action('addFood')"
      >
        <v-icon icon="$add" start />
        {{ $t('recall.menu.food.add') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { MealState } from '@intake24/common/surveys';

import { useMealList } from '../use-meal-list';
import MealItemExpandable from './meal-item-expandable.vue';
import MealItem from './meal-item.vue';

defineOptions({
  name: 'MealList',
  components: { MealItem, MealItemExpandable },
});

const props = defineProps({
  expandable: {
    type: Boolean,
    default: false,
  },
  meals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});
const emit = defineEmits(['action']);

const {
  foodCount,
  selectedMealId,
  selectedFoodId,
  isSelectedFoodInMeal,
  action,
} = useMealList(props, { emit });
</script>

<style lang="scss"></style>
