<template>
  <v-list-item v-for="food in filteredFoods" :key="food.id" @click="foodSelected(food)">
    <template #prepend>
      <v-icon>$food</v-icon>
    </template>
    <v-list-item-title>{{ getFoodDescription(food) }} </v-list-item-title>
  </v-list-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { FoodState } from '@intake24/common/surveys';

import { defineComponent, ref } from 'vue';

import { getFoodDescription } from '@intake24/common/surveys';
import { useSurvey } from '@intake24/survey/stores';
import { findMeal } from '@intake24/survey/util';

export default defineComponent({
  name: 'MealFoodChooser',

  props: {
    mealId: {
      type: String,
      required: true,
    },
    filter: {
      type: Function as PropType<(foodId: string) => boolean>,
      required: true,
    },
  },

  emits: {
    selected: (_foodId: string) => true,
  },

  setup(props) {
    const store = useSurvey();
    const meal = findMeal(store.currentState.meals, props.mealId);

    const foods = ref<FoodState[]>(meal.foods);

    return { foods };
  },

  computed: {
    filteredFoods(): FoodState[] {
      return this.foods.filter(food => this.filter(food.id));
    },
  },

  methods: {
    getFoodDescription,

    foodSelected(food: FoodState): void {
      this.$emit('selected', food.id);
    },
  },
});
</script>

<style lang="scss" scoped></style>
