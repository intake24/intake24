<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <review-meal-list
      v-if="!$vuetify.display.mobile && prompt.review.desktop"
      v-bind="{ meals, review: prompt.review.desktop }"
      @action="action"
      @bottom-reached="updateBottomReached('desktop', $event)"
      @reviewed="updateReviewed('desktop', $event)"
    />
    <review-meal-list-mobile
      v-if="$vuetify.display.mobile && prompt.review.mobile"
      v-bind="{ meals, review: prompt.review.mobile }"
      @action="action"
      @bottom-reached="updateBottomReached('mobile', $event)"
      @reviewed="updateReviewed('mobile', $event)"
    />
    <template #actions>
      <next :disabled="!isValid && !isValidMobile" @click="action('next')">
        {{ $t('recall.actions.submit') }}
      </next>
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PromptLayout } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { computed, ref } from 'vue';

import { ReviewMealList, ReviewMealListMobile } from '@intake24/survey/components/layouts';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'submit-prompt'>(),
  meals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action } = usePromptUtils(props, { emit });

const bottomReached = ref<Record<PromptLayout, boolean>>({ desktop: false, mobile: false });
const reviewed = ref<Record<PromptLayout, string[]>>({ desktop: [], mobile: [] });

function updateBottomReached(layout: PromptLayout, value: boolean) {
  bottomReached.value[layout] = value;
}

function updateReviewed(layout: PromptLayout, value: string[]) {
  reviewed.value[layout] = value;
}

const isValid = computed(() => {
  if (props.prompt.review.desktop === 'scroll')
    return bottomReached.value.desktop;

  if (props.prompt.review.desktop === 'checkbox')
    return props.meals.length === reviewed.value.desktop.length;

  if (props.prompt.review.desktop === 'onecheckbox')
    return reviewed.value.desktop.length === 1;

  return true;
});

const isValidMobile = computed(() => {
  if (props.prompt.review.mobile === 'scroll')
    return bottomReached.value.mobile;

  if (props.prompt.review.mobile === 'checkbox')
    return props.meals.length === reviewed.value.mobile.length;

  if (props.prompt.review.desktop === 'onecheckbox')
    return reviewed.value.mobile.length === 1;

  return true;
});
</script>

<style lang="scss" scoped></style>
