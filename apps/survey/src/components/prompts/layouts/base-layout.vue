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
    <slot name="prompt-description">
      <v-card v-if="!isInMultiPrompt && i18n.description" class="mb-4" :tile="$vuetify.display.mobile">
        <div class="pa-4" v-html="i18n.description" />
      </v-card>
    </slot>
    <slot />
    <prompt-actions
      id="actions"
      class="navigation pa-4 px-md-0"
    >
      <template v-if="desktopActions.length">
        <v-btn
          v-for="item in desktopActions"
          :key="item.type"
          :color="item.color ?? undefined"
          :disabled="item.type === 'next' && !isValid"
          :title="Object.keys(item.label).length ? translate(item.label) : translate(item.text)"
          :variant="item.variant"
          @click="action(item.type, foodOrMealId, item.params)"
        >
          {{ translate(item.text) }}
        </v-btn>
      </template>
      <template v-else>
        <slot name="actions" />
      </template>
    </prompt-actions>
    <meal-list-mobile :disabled="!showSummary || isInMultiPrompt" :meals @action="action" />
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

defineOptions({ name: 'BaseLayout' });

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
  i18n,
  isInMultiPrompt,
  meals,
  showSummary,
  translate,
} = useLayout(props, { emit, slots });
</script>

<style lang="scss"></style>
