<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <template v-if="prompt.separateDrinks">
      <editable-food-list
        v-model="foodsOnly"
        v-bind="{ prompt, section }"
        :focus="prompt.inputAutoFocus"
        mode="foodsOnly"
        @delete="deleteFood"
      />
      <editable-food-list
        v-bind="{ prompt, section }"
        v-model="drinksOnly"
        mode="drinksOnly"
        @delete="deleteFood"
      />
    </template>
    <editable-food-list
      v-else
      v-bind="{ prompt, section }"
      v-model="state"
      :focus="prompt.inputAutoFocus"
      @delete="deleteFood"
    />
    <template #actions>
      <v-btn
        v-if="!meal.flags.includes('meal-time:disabled')"
        :title="$t('recall.actions.mealTime')"
        @click="action('mealTime', meal.id)"
      >
        <v-icon icon="fas fa-clock" start />
        {{ $t('recall.actions.mealTime') }}
      </v-btn>
      <confirm-dialog
        :label="$t('recall.menu.meal.delete')"
        @confirm="action('deleteMeal', meal.id)"
      >
        <template #activator="{ props }">
          <v-btn
            :title="$t('recall.actions.deleteMeal')"
            v-bind="props"
          >
            <v-icon icon="$delete" start />
            {{ $t('recall.actions.nav.deleteMeal') }}
          </v-btn>
        </template>
        <i18n-t keypath="recall.menu.meal.deleteConfirm" tag="span">
          <template #item>
            <span class="font-weight-medium">{{ mealName }}</span>
          </template>
        </i18n-t>
      </confirm-dialog>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PromptStates } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { useMealUtils, usePromptUtils } from '@intake24/survey/composables';
import { ConfirmDialog } from '@intake24/ui';

import { CardLayout } from '../layouts';
import { EditableFoodList, Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'edit-meal-prompt'>(),
  meal: {
    type: Object as PropType<MealState>,
    required: true,
  },
  modelValue: {
    type: Array as PropType<PromptStates['edit-meal-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { mealName } = useMealUtils(props);
const { action } = usePromptUtils(props, { emit });

const state = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const isValid = computed(() => !!state.value.length);
const drinksOnly = computed({
  get() {
    return state.value.filter(food => food.flags.includes('is-drink'));
  },
  set(val) {
    // eslint-disable-next-line ts/no-use-before-define
    state.value = [...foodsOnly.value, ...val];
  },
});
const foodsOnly = computed({
  get() {
    return state.value.filter(food => !food.flags.includes('is-drink'));
  },
  set(val) {
    state.value = [...drinksOnly.value, ...val];
  },
});

function deleteFood(foodId: string) {
  const food = props.meal.foods.find(food => food.id === foodId);
  if (!food)
    return;

  action('deleteFood', foodId);
}
</script>
