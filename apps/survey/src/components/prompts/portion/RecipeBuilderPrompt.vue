<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.activeStep" :tile="$vuetify.display.mobile" @update:model-value="update">
      <v-expansion-panel
        v-for="(step, index) in food.template.steps"
        :key="step.id"
      >
        <v-expansion-panel-title>
          <v-avatar class="me-2" color="primary" size="28">
            <span class="text-white font-weight-medium">{{ index + 1 }}</span>
          </v-avatar>
          {{ translate(step.name) }}
          <template #actions>
            <expansion-panel-actions :valid="isStepValid(state.steps[index], step)" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-sheet class="mb-4">
            {{ translate(step.description) }}
          </v-sheet>
          <component
            :is="`${step.type}-step`"
            v-model="state.steps[index]"
            :disabled="!!index && !isStepValid(state.steps[index - 1], step)"
            v-bind="{
              localeId,
              prompt,
              section,
              surveySlug,
              step,
              states: state.steps,
            }"
            @update:model-value="stepUpdate(index)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <missing-all-recipe-ingredients
      v-bind="{
        modelValue: stepsConfirmed && !atLeastOneFoodSelected,
        message: $t('prompts.recipeBuilder.missingAllIngredients'),
      }"
      :class="{ 'mt-4': $vuetify.display.mobile }"
    />
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { RecipeBuilder } from '@intake24/common/surveys';

import { computed } from 'vue';

import { ExpansionPanelActions, MissingAllRecipeIngredients } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { steps, useFoodBuilder } from './builders';

defineOptions({
  components: { ...steps },
});

const props = defineProps({
  ...createPortionPromptProps<'recipe-builder-prompt', RecipeBuilder>(),
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { translate } = useI18n();
const { action } = usePromptUtils(props, { emit });

const {
  state,
  isStepValid,
  isValid,
  stepsConfirmed,
  stepUpdate,
  update,
} = useFoodBuilder<'recipe-builder-prompt', RecipeBuilder>(props, { emit });

const atLeastOneFoodSelected = computed(() => state.value.steps.some(step => step.foods.length));
</script>

<style lang="scss" scoped></style>
