<template>
  <v-card flat>
    <v-toolbar color="white">
      <v-toolbar-title>
        {{ $t('recall.menu.title') }}
      </v-toolbar-title>
      <v-btn
        color="primary"
        rounded="pill"
        :title="$t('recall.menu.meal.add')"
        variant="outlined"
        @click="action('addMeal')"
      >
        <v-icon icon="$add" start />
        {{ $t('recall.menu.meal.add') }}
      </v-btn>
    </v-toolbar>
    <v-divider />
    <v-list class="meal-list__list pt-0" density="compact" tile>
      <div v-for="meal in meals" :key="meal.id" class="mb-4">
        <component
          :is="expandable ? 'meal-item-expandable' : 'meal-item'"
          v-bind="{ meal, selectedMealId, selectedFoodId }"
          :selected-food-in-meal="isSelectedFoodInMeal(meal.id)"
          @action="action"
        />
        <div
          class="d-flex flex-row align-center pa-2 ga-2"
          :class="{
            'justify-between': review === 'checkbox',
            'justify-end': review !== 'checkbox',
          }"
        >
          <v-alert
            v-if="review === 'checkbox'"
            border="start"
            class="px-3"
            color="info"
            density="compact"
            variant="tonal"
          >
            <v-checkbox-btn
              v-model="reviewed"
              class="font-weight-medium secondary"
              color="secondary"
              density="comfortable"
              hide-details
              :label="$t('prompts.reviewConfirm.meal')"
              :value="meal.id"
            >
              <template #label>
                <span class="font-weight-medium text-secondary">
                  {{ $t('prompts.reviewConfirm.meal') }}
                </span>
              </template>
            </v-checkbox-btn>
          </v-alert>
          <v-btn
            color="primary"
            rounded="pill"
            size="small"
            :title="$t('recall.menu.meal.editFoods')"
            variant="outlined"
            @click="action('editMeal', meal.id)"
          >
            {{ $t('recall.menu.meal.editFoods') }}
          </v-btn>
        </div>
      </div>
    </v-list>
    <v-card-text v-if="review === 'onecheckbox'" class="pt-0">
      <v-alert border="start" color="info" variant="tonal">
        <v-checkbox
          v-model="reviewed"
          class="font-weight-medium secondary"
          color="secondary"
          hide-details
          :label="$t('prompts.reviewConfirm.survey')"
        >
          <template #label>
            <span class="font-weight-medium text-secondary">
              {{ $t('prompts.reviewConfirm.survey') }}
            </span>
          </template>
        </v-checkbox>
      </v-alert>
    </v-card-text>
    <div v-if="!bottomReached" v-intersect="bottomIntersect" />
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { ReviewOptions } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { useMealList } from '../use-meal-list';
import { useReviewList } from '../use-review-list';
import MealItemExpandable from './meal-item-expandable.vue';
import MealItem from './meal-item.vue';

export default defineComponent({
  name: 'ReviewMealList',

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
    review: {
      type: [String, Boolean] as PropType<ReviewOptions>,
      default: false,
    },
  },

  setup(props, ctx) {
    const { bottomIntersect, bottomReached, reviewed } = useReviewList(props, ctx);
    const { selectedMealId, selectedFoodId, isSelectedFoodInMeal, action } = useMealList(
      props,
      ctx,
    );

    return {
      bottomIntersect,
      bottomReached,
      reviewed,
      selectedMealId,
      selectedFoodId,
      isSelectedFoodInMeal,
      action,
    };
  },
});
</script>

<style lang="scss">
</style>
