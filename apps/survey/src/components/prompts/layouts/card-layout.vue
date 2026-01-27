<template>
  <div>
    <v-card class="mb-4" :tile="$vuetify.display.mobile">
      <breadcrumbs v-bind="{ food, meal, promptName: i18n.name }" />
      <slot name="prompt-text">
        <v-card-text v-if="i18n.text" class="pt-0">
          <v-divider class="mb-2" />
          <h3>{{ i18n.text }}</h3>
        </v-card-text>
      </slot>
    </v-card>
    <v-card :tile="$vuetify.display.mobile">
      <slot name="prompt-description">
        <div
          v-if="i18n.description"
          class="px-4 pt-4"
          :class="{ 'pb-4': !hasDefaultSlot }"
          v-html="i18n.description"
        />
      </slot>
      <slot />
      <prompt-actions
        id="actions"
        class="navigation px-4 pt-0 pb-4"
      >
        <template v-if="desktopActions.length">
          <v-btn
            v-for="item in desktopActions"
            :key="item.type"
            :color="item.color ?? undefined"
            :title="Object.keys(item.label).length ? translate(item.label) : translate(item.text)"
            :variant="item.variant"
            @click="action(item.type, foodOrMealId, item.params)"
          >
            <v-icon v-if="item.icon" start>
              {{ item.icon }}
            </v-icon>
            {{ translate(item.text) }}
          </v-btn>
        </template>
        <template v-else>
          <slot name="actions" />
        </template>
      </prompt-actions>
      <meal-list-mobile :disabled="!showSummary || isInMultiPrompt" :meals @action="action" />
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompt } from '@intake24/common/prompts';
import type { FoodState, MealState, PromptSection } from '@intake24/common/surveys';

import { useSlots } from 'vue';

import { MealListMobile } from '@intake24/survey/components/layouts/meal-list';

import Breadcrumbs from './breadcrumbs.vue';
import { useLayout } from './use-layout';

defineOptions({ name: 'CardLayout' });

const props = defineProps(
  {
    prompt: {
      type: Object as PropType<Prompt>,
      required: true,
    },
    section: {
      type: String as PropType<PromptSection>,
      required: true,
    },
    food: {
      type: Object as PropType<FoodState>,
    },
    meal: {
      type: Object as PropType<MealState>,
    },
    isValid: {
      type: Boolean,
      default: false,
    },
  },
);

const emit = defineEmits(['action']);
const slots = useSlots();

const {
  action,
  desktopActions,
  foodOrMealId,
  hasDefaultSlot,
  i18n,
  isInMultiPrompt,
  meals,
  showSummary,
  translate,
} = useLayout(props, { emit, slots });
</script>

<style lang="scss"></style>
