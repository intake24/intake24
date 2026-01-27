<template>
  <div>
    <v-list-item
      :class="{ 'selected': isSelected || selectedFoodInMeal, 'selected-food': selectedFoodInMeal }"
      @click="action('selectMeal', meal.id)"
    >
      <v-list-item-title class="text-body-2 font-weight-medium text-wrap">
        {{ mealName }}
      </v-list-item-title>
      <template #append>
        <v-list-item-action class="me-4 my-auto">
          <span v-if="mealTime && !meal.flags.includes('meal-time:hidden')" class="text-body-2">
            {{ mealTime }}
          </span>
          <v-tooltip v-else-if="!mealTime" location="bottom">
            <template #activator="{ props }">
              <v-icon size="small" v-bind="props">
                $question
              </v-icon>
            </template>
            <span>{{ $t('recall.menu.mealSuggested') }}</span>
          </v-tooltip>
        </v-list-item-action>
        <v-list-item-action class="my-auto">
          <context-menu v-bind="{ meal, menu }" @action="action" />
        </v-list-item-action>
      </template>
    </v-list-item>
    <v-divider />
    <template v-if="meal.foods.length">
      <food-item
        v-for="food in meal.foods"
        :key="food.id"
        v-bind="{ food, meal, selectedFoodId }"
        @action="action"
      />
      <v-divider />
    </template>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { MealState } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { useMealItem } from '../use-meal-item';
import ContextMenu from './context-menu.vue';
import FoodItem from './food-item.vue';

export default defineComponent({
  name: 'MealItem',

  components: { ContextMenu, FoodItem },

  props: {
    meal: {
      type: Object as PropType<MealState>,
      required: true,
    },
    selectedFoodId: {
      type: String,
    },
    selectedFoodInMeal: {
      type: Boolean,
      required: true,
    },
    selectedMealId: {
      type: String,
    },
  },

  setup(props, ctx) {
    const { action, isSelected, menu, mealName, mealTime } = useMealItem(props, ctx);

    return {
      action,
      isSelected,
      menu,
      mealName,
      mealTime,
    };
  },
});
</script>

<style lang="scss"></style>
