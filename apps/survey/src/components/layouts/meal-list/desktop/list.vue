<template>
  <v-card>
    <v-card-title class="pa-4">
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
        :title="$t('recall.menu.meal.add')"
        variant="tonal"
        @click="action('addMeal')"
      >
        <v-icon icon="$add" start />
        {{ $t('recall.menu.meal.add') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { MealState } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { useMealList } from '../use-meal-list';
import MealItemExpandable from './meal-item-expandable.vue';
import MealItem from './meal-item.vue';

export default defineComponent({
  name: 'MealList',

  components: { MealItem, MealItemExpandable },

  props: {
    expandable: {
      type: Boolean,
      default: false,
    },
    meals: {
      type: Array as PropType<MealState[]>,
      required: true,
    },
  },

  setup(props, ctx) {
    const { selectedMealId, selectedFoodId, isSelectedFoodInMeal, action } = useMealList(
      props,
      ctx,
    );

    return {
      selectedMealId,
      selectedFoodId,
      isSelectedFoodInMeal,
      action,
    };
  },
});
</script>

<style lang="scss"></style>
