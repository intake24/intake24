<template>
  <v-expansion-panel>
    <v-expansion-panel-title>{{ i18n.name }}</v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-card flat :tile="$vuetify.display.mobile">
        <slot name="prompt-description">
          <div
            v-if="i18n.description"
            :class="{ 'pb-4': !hasDefaultSlot }"
            v-html="i18n.description"
          />
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
      </v-card>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompt } from '@intake24/common/prompts';
import type { FoodState, MealState, PromptSection } from '@intake24/common/surveys';

import { useSlots } from 'vue';

import { useLayout } from './use-layout';

defineOptions({ name: 'PanelLayout' });

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
  translate,
} = useLayout(props, { emit, slots });
</script>

<style lang="scss"></style>
