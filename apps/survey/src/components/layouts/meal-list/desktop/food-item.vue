<template>
  <div>
    <v-list-item
      :class="{ 'selected': food.id === selectedFoodId, 'ps-4': !linked, 'ps-8': linked }"
      link
      @click="action('selectFood', food.id)"
    >
      <v-list-item-title class="text-body-2 text-wrap d-flex flex-column">
        <span class="food-name">{{ foodName }}</span>
        <span v-if="customPromptAnswerLabels" class="text-caption text-grey">
          {{ customPromptAnswerLabels }}
        </span>
      </v-list-item-title>
      <template #append>
        <v-list-item-action class="d-flex flex-row me-4">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-if="food.type === 'free-text'"
                v-bind="props"
                class="me-1"
                color="grey"
                icon="$question"
                size="small"
              />
              <v-icon v-else class="me-1" color="green-darken-2" v-bind="props" icon="$ok" size="small" />
            </template>
            <span>{{ $t(`recall.menu.food.${food.type}._`) }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon

                :color="isPortionSizeComplete ? 'green darken-2' : undefined"
                size="small"
                v-bind="props"
              >
                {{ isPortionSizeComplete ? '$ok' : '$question' }}
              </v-icon>
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
        <v-list-item-action class="my-auto">
          <context-menu v-bind="{ food, meal, menu }" @action="action" />
        </v-list-item-action>
      </template>
    </v-list-item>
    <food-item
      v-for="linkedFood in food.linkedFoods"
      :key="linkedFood.id"
      v-bind="{ food: linkedFood, linked: true, meal, selectedFoodId }"
      @action="action"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';

import type { FoodState, MealState } from '@intake24/common/surveys';
import { useI18n } from '@intake24/i18n';
import { useSurvey } from '@intake24/survey/stores';

import { useFoodItem } from '../use-food-item';
import ContextMenu from './context-menu.vue';

export default defineComponent({
  name: 'FoodItem',

  components: { ContextMenu },

  props: {
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

  setup(props, ctx) {
    const { i18n: { locale } } = useI18n();
    const survey = useSurvey();
    const { action, foodName, isPortionSizeComplete, menu } = useFoodItem(props, ctx);

    const customPromptAnswerLabels = computed(() => {
      if (!props.food.customPromptAnswers || Object.keys(props.food.customPromptAnswers).length === 0) {
        return '';
      }
      const foodPrompts = survey.foodPrompts;
      const answers: string[] = [];
      Object.entries(props.food.customPromptAnswers).forEach(([promptId, answer]) => {
        const prompt = foodPrompts.find(p => p.id === promptId);
        let displayText = '';
        // Handle different prompt types
        if (prompt && 'options' in prompt && prompt.options) {
          const options = prompt.options[locale.value] || prompt.options.en || [];
          if (Array.isArray(answer)) {
            // Multiple selection
            const labels = answer.map(value =>
              options.find(opt => opt.value === value)?.shortLabel || options.find(opt => opt.value === value)?.label || value,
            );
            displayText = labels.join(', ');
          }
          else {
            // Single selection
            displayText = options.find(opt => opt.value === answer)?.shortLabel || options.find(opt => opt.value === answer)?.label || '';
          }
        }
        if (displayText.trim())
          answers.push(displayText);
      });
      return answers.join(', ');
    });
    return { action, foodName, isPortionSizeComplete, menu, customPromptAnswerLabels };
  },
});
</script>

<style scoped></style>
