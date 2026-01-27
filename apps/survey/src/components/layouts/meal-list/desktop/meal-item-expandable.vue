<template>
  <v-list-group
    :class="{ 'selected': isSelected || selectedFoodInMeal, 'selected-food': selectedFoodInMeal }"
    :value="true"
    @click="action('selectMeal', meal.id)"
  >
    <!--     <template #prepend>
      <v-icon :class="{ rotate: isSelected || selectedFoodInMeal }">
        $expand
      </v-icon>
    </template> -->
    <template #activator>
      <v-list-item-title class="text-body-2 font-weight-medium text-wrap">
        {{ mealName }}
      </v-list-item-title>
      <v-list-item-action>
        <span v-if="mealTime?.length">
          {{ mealTime }}
        </span>
        <v-icon v-else size="small">
          $question
        </v-icon>
      </v-list-item-action>
      <v-list-item-action class="my-auto">
        <context-menu v-bind="{ meal, menu }" @action="action" />
      </v-list-item-action>
    </template>
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
  </v-list-group>
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
