<template>
  <v-toolbar class="px-4" color="white" :density="$vuetify.display.mobile ? 'compact' : 'default'">
    <v-breadcrumbs class="ps-0 text-body-2" :items="items">
      <template #divider>
        <v-icon icon="fas fa-caret-right" />
      </template>
    </v-breadcrumbs>
    <template v-if="!$vuetify.display.mobile">
      <v-spacer />
      <help-nav :survey-id />
    </template>
  </v-toolbar>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodState, MealState } from '@intake24/common/surveys';

import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useFoodUtils, useMealUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { HelpNav } from '../../elements';

type BreadcrumbsElement = {
  title: string;
  disabled: boolean;
};

const props = defineProps({
  food: {
    type: Object as PropType<FoodState>,
  },
  meal: {
    type: Object as PropType<MealState>,
  },
  promptName: {
    type: String,
    required: true,
  },
});

const { i18n: { t } } = useI18n();
const { getFoodName } = useFoodUtils();
const { getMealName, getMealNameWithTime } = useMealUtils();
const route = useRoute();
const surveyId = computed(() => route.params.surveyId.toString());

function getMealLabel(meal: MealState, mealTime = true) {
  return mealTime && !meal.flags.includes('meal-time:hidden') ? getMealNameWithTime(meal) : getMealName(meal);
}

const foodElement = computed(() => props.food ? { title: getFoodName(props.food), disabled: false } : undefined);
const mealElement = computed(() => props.meal ? { title: getMealLabel(props.meal), disabled: false } : undefined);
const breadCrumbs = computed(() => {
  const elements: BreadcrumbsElement[] = [
    mealElement.value ?? { title: t('recall._'), disabled: false },
  ];

  if (foodElement.value)
    elements.push(foodElement.value);

  elements.push({ title: props.promptName, disabled: false });

  return elements;
});
const items = computed(() => breadCrumbs.value.filter(el => !el.disabled));
</script>

<style lang="scss">
.v-breadcrumbs {
  .v-breadcrumbs-item:last-of-type {
    font-weight: 600;
  }
}
</style>
