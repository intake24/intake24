<template>
  <div>
    <v-list-item
      :class="{ 'selected': food.id === selectedFoodId, 'ps-4': !linked, 'ps-8': linked }"
      link
      @click="action('selectFood', food.id)"
    >
      <v-list-item-title class="text-body-2 text-wrap d-flex flex-column">
        <span class="food-name">{{ foodName }}</span>
        <span v-if="customPromptAnswerLabels" class="text-caption text-grey">
          {{ customPromptAnswerLabels }}
        </span>
      </v-list-item-title>
      <template #append>
        <v-list-item-action class="d-flex flex-row me-4">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-if="food.type === 'free-text'"
                v-bind="props"
                class="me-1"
                color="grey"
                icon="$question"
                size="small"
              />
              <v-icon v-else class="me-1" color="green-darken-2" v-bind="props" icon="$ok" size="small" />
            </template>
            <span>{{ $t(`recall.menu.food.${food.type}._`) }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon

                :color="isPortionSizeComplete && isCustomPromptComplete ? 'green darken-2' : undefined"
                size="small"
                v-bind="props"
              >
                {{ isPortionSizeComplete && isCustomPromptComplete ? '$ok' : '$question' }}
              </v-icon>
            </template>
            <span>
              {{
                $t(
                  `recall.menu.food.${food.type}.${isPortionSizeComplete && isCustomPromptComplete ? 'complete' : 'incomplete'}`,
                )
              }}
            </span>
          </v-tooltip>
        </v-list-item-action>
        <v-list-item-action class="my-auto">
          <context-menu v-bind="{ food, meal, menu }" @action="action" />
        </v-list-item-action>
      </template>
    </v-list-item>
    <food-item
      v-for="linkedFood in food.linkedFoods"
      :key="linkedFood.id"
      v-bind="{ food: linkedFood, linked: true, meal, selectedFoodId }"
      @action="action"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { FoodState, MealState } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { useFoodItem } from '../use-food-item';
import ContextMenu from './context-menu.vue';

export default defineComponent({
  name: 'FoodItem',

  components: { ContextMenu },

  props: {
    food: {
      type: Object as PropType<FoodState>,
      required: true,
    },
    linked: {
      type: Boolean,
      default: false,
    },
    meal: {
      type: Object as PropType<MealState>,
      required: true,
    },
    selectedFoodId: {
      type: String,
      required: false,
    },
  },

  setup(props, ctx) {
    const { action, foodName, isPortionSizeComplete, isCustomPromptComplete, menu, customPromptAnswerLabels } = useFoodItem(props, ctx);
    return { action, foodName, isPortionSizeComplete, isCustomPromptComplete, menu, customPromptAnswerLabels };
  },
});
</script>

<style scoped></style>
