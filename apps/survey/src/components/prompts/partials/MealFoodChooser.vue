<template>
  <div class="d-flex flex-column ga-2">
    <v-card
      v-for="food in foods"
      :key="food.id"
      class="pa-3 text"
      color="primary"
      variant="tonal"
      @click="foodSelected(food)"
    >
      <div class="text-black opacity-90 text-body-2 font-weight-medium">
        <v-icon icon="$food" start />
        {{ getFoodDescription(food) }}
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodState, MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { getFoodDescription } from '@intake24/common/surveys';

const props = defineProps({
  meal: {
    type: Object as PropType<MealState>,
    required: true,
  },
  filter: {
    type: Function as PropType<(food: FoodState) => boolean>,
    required: true,
  },
});

const emit = defineEmits(['selected']);

const foods = computed(() => props.meal.foods.filter(props.filter));

function foodSelected(food: FoodState): void {
  emit('selected', food.id);
};
</script>

<style lang="scss" scoped></style>
