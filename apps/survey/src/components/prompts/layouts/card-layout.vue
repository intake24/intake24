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
          :class="{ 'pb-4': !hasDefaultSlot && !showMissingNutrientNotice }"
          v-html="i18n.description"
        />
      </slot>
      <v-alert
        v-if="showMissingNutrientNotice"
        class="mx-4 mt-4"
        density="comfortable"
        :text="t('common.notices.nutrientDataUnavailable')"
        type="info"
        variant="tonal"
      />
      <slot />
      <v-card-actions
        v-if="!$vuetify.display.mobile || prompt.actions?.both"
        id="actions"
        class="navigation px-4 pt-0 pb-4 d-flex flex-column-reverse flex-md-row flex-wrap align-stretch ga-3"
      >
        <template v-if="desktopActions.length">
          <v-btn
            v-for="item in desktopActions"
            :key="item.type"
            class="px-4"
            :color="item.color ?? undefined"
            size="large"
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
      </v-card-actions>
      <div v-if="!isInMultiPrompt && $vuetify.display.mobile" id="actions" class="bottom-navigation">
        <div v-if="showSummary" class="bottom-navigation__summary">
          <meal-list-mobile v-bind="{ meals }" @action="action" />
        </div>
        <div v-if="mobileActions.length || hasNavActionsSlot" class="bottom-navigation__actions">
          <template v-if="mobileActions.length">
            <template v-for="(item, idx) in mobileActions" :key="item.type">
              <v-btn
                :color="item.color ?? undefined"
                :title="
                  Object.keys(item.label).length ? translate(item.label) : translate(item.text)
                "
                :value="item.type"
                :variant="['outlined', 'text'].includes(item.variant) ? 'text' : undefined"
                @click="action(item.type, foodOrMealId, item.params)"
              >
                <span class="text-overline font-weight-medium">
                  {{ translate(item.text) }}
                </span>
                <v-icon v-if="item.icon" class="pb-1">
                  {{ item.icon }}
                </v-icon>
              </v-btn>
              <v-divider
                v-if="idx + 1 < mobileActions.length"
                :key="`div-${item.type}`"
                vertical
              />
            </template>
          </template>
          <template v-else>
            <slot name="nav-actions" />
          </template>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, useSlots } from 'vue';

import type { Prompt } from '@intake24/common/prompts';
import type { FoodState, MealState, PromptSection } from '@intake24/common/surveys';
import { useI18n } from '@intake24/i18n';
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
const { i18n: { t } } = useI18n();

const {
  action,
  desktopActions,
  foodOrMealId,
  hasDefaultSlot,
  hasNavActionsSlot,
  i18n,
  isInMultiPrompt,
  meals,
  mobileActions,
  showSummary,
  translate,
} = useLayout(props, { emit, slots });

const encodedFood = computed(() => (props.food?.type === 'encoded-food' ? props.food : undefined));

const showMissingNutrientNotice = computed(() => encodedFood.value?.data.nutrientDataAvailable === false);
</script>

<style lang="scss"></style>
