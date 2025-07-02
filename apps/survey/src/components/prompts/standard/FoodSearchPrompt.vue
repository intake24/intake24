<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text>
      <food-browser
        v-bind="{ localeId, surveySlug, prompt, section, rootCategory, rootCategoryToggleable, modelValue }"
        @food-missing="foodMissing"
        @food-selected="foodSelected"
        @recipe-builder="recipeBuilder"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </v-card-text>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { FoodState } from '@intake24/common/surveys';
import type { RecipeFood } from '@intake24/common/types';
import type { FoodHeader } from '@intake24/common/types/http';
import { FoodBrowser } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { foodsService } from '@intake24/survey/services';
import { CardLayout } from '../layouts';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'food-search-prompt', FoodState>(),
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
  modelValue: {
    type: String as PropType<string | null>,
    required: true,
  },
});

const emit = defineEmits(['action', 'foodMissing', 'foodSelected', 'update:modelValue', 'recipeBuilder']);

const { action } = usePromptUtils(props, { emit });

const isValid = true;
const rootCategory = computed(() => {
  const mealFlagCategory = props.meal?.flags?.find(flag => flag.startsWith('food-search:'))?.split(':')[1];
  const foodFlagCategory = props.food?.flags?.find(flag => flag.startsWith('search-category:') || flag.startsWith('search-category-toggle:'))?.split(':')[1];

  const category = foodFlagCategory ?? mealFlagCategory;

  if (!category)
    return undefined;

  const [foodsCategory, drinksCategory] = category.split('|');

  return props.food?.flags.includes('is-drink') ? drinksCategory : foodsCategory;
});

const rootCategoryToggleable = computed(() => !!props.food?.flags?.find(flag => flag.startsWith('search-category-toggle:')));

async function foodSelected(food: FoodHeader) {
  const foodData = await foodsService.getData(props.localeId, food.code);
  // Food data API returns the main local food name.
  // Override it here with the selected name (which could be one of the
  // alternative food names or the main name).
  foodData.localName = food.name;
  emit('foodSelected', foodData);
}

function foodMissing(searchTerm?: string | null) {
  emit('foodMissing', searchTerm);
}

function recipeBuilder(recipeFood: RecipeFood) {
  emit('recipeBuilder', recipeFood);
}
</script>

<style lang="scss" scoped></style>
