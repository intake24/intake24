<template>
  <div>
    <v-list-item
      :class="{
        'selected': contextId ? food.id === contextId : food.id === selectedFoodId,
        'ps-4': !linked,
        'ps-8': linked,
      }"
      link
      @click="updateContextId(food.id)"
    >
      <v-list-item-title class="text-body-2 text-wrap d-flex flex-column">
        <span class="food-name">{{ foodName }}</span>
        <span v-if="customPromptAnswerLabels" class="text-caption text-grey">
          {{ customPromptAnswerLabels }}
        </span>
      </v-list-item-title>
      <template #append>
        <v-list-item-action class="d-flex flex-row">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                class="me-1"
                :color="food.type === 'free-text' ? 'grey' : 'green-darken-2'"
                :icon="food.type === 'free-text' ? '$question' : '$ok'"
                size="small"
              />
            </template>
            <span>{{ $t(`recall.menu.food.${food.type}._`) }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                :color="isPortionSizeComplete && isCustomPromptComplete ? 'green darken-2' : undefined"
                :icon="isPortionSizeComplete && isCustomPromptComplete ? '$ok' : '$question'"
                size="small"
              />
            </template>
            <span>
              {{
                $t(
                  `recall.menu.food.${food.type}.${isPortionSizeComplete ? 'complete' : 'incomplete'}`,
                )
              }}
            </span>
          </v-tooltip>
        </v-list-item-action>
      </template>
    </v-list-item>
    <context-menu v-bind="{ contextId, food, meal, menu }" @action="action" />
    <food-item
      v-for="linkedFood in food.linkedFoods"
      :key="linkedFood.id"
      v-bind="{ contextId, food: linkedFood, linked: true, meal, selectedFoodId }"
      @action="action"
      @update:context-id="updateContextId"
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
    contextId: {
      type: String,
    },
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

  emits: ['action', 'update:context-id'],

  setup(props, ctx) {
    const { action, foodName, isPortionSizeComplete, isCustomPromptComplete, menu, customPromptAnswerLabels } = useFoodItem(props, ctx);

    const updateContextId = (id: string) => {
      ctx.emit('update:context-id', id);
    };

    return {
      action,
      foodName,
      isPortionSizeComplete,
      menu,
      customPromptAnswerLabels,
      isCustomPromptComplete,
      updateContextId,
    };
  },
});
</script>

<style scoped></style>
