<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.activeStep" :tile="$vuetify.display.mobile" @update:model-value="update">
      <v-expansion-panel
        v-for="(step, index) in food.template.steps"
        :key="step.id"
        :disabled="!!index && !isStepValid(state.steps[index - 1], food.template.steps[index - 1])"
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
          <component
            :is="`${step.type}-step`"
            v-model="state.steps[index]"
            v-bind="{
              entities,
              localeId,
              prompt,
              section,
              surveySlug,
              step,
              states: state.steps,
              units,
            }"
            :disabled="!!index && !isStepValid(state.steps[index - 1], food.template.steps[index - 1])"
            @update:model-value="onStepUpdate(index)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { EncodedFood, GenericBuilder, PortionSizeParameters, StandardUnit } from '@intake24/common/surveys';

import { computed, onMounted } from 'vue';

import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { evaluateCondition } from '@intake24/survey/dynamic-recall/prompt-manager';
import { getEntityId } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { steps, useFoodBuilder } from './builders';

defineOptions({ components: { ...steps } });

const props = defineProps({
  ...createPortionPromptProps<'generic-builder-prompt', GenericBuilder>(),
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
  categories,
  foods,
  state,
  isStepValid,
  isValid,
  resolveStepDependency,
  stepUpdate,
  update,
} = useFoodBuilder<'generic-builder-prompt', GenericBuilder>(props, { emit });

const entities = computed(() => state.value.steps.reduce((acc, step, idx) => {
  if (step.type === 'condition' && step.option) {
    const foodState = {
      id: getEntityId(),
      type: 'encoded-food',
      searchTerm: 'builder-condition',
      flags: [],
      linkedFoods: [],
      customPromptAnswers: {},
      portionSizeMethodIndex: null,
      portionSize: null,
    } satisfies Omit<EncodedFood, 'data'>;

    acc.categories = acc.categories.filter(
      data => step.option?.some(
        condition => evaluateCondition(condition, { food: { ...foodState, data: data as EncodedFood['data'] } }),
      ),
    );
    acc.foods = acc.foods.filter(
      data => step.option?.some(
        condition => evaluateCondition(condition, { food: { ...foodState, data } }),
      ),
    );
  }

  if (step.type === 'select-entity' && step.option && props.food.template.steps[idx].type === 'select-entity') {
    const { resource } = props.food.template.steps[idx];
    acc.categories = acc.categories.filter(food => resource === 'categories' ? food.categories.includes(step.option!) : food.code === step.option);
    acc.foods = acc.foods.filter(food => resource === 'categories' ? food.categories.includes(step.option!) : food.code === step.option);
  }

  return acc;
}, { categories: categories.value, foods: foods.value }));

const selectedFood = computed(() => entities.value.foods.length === 1 ? entities.value.foods.at(0) : undefined);

const coefficient = computed(() => state.value.steps.reduce((acc, step) => {
  if (step.type !== 'coefficient' || !step.option)
    return acc;

  acc = acc * step.option;
  return acc;
}, 1));

const units = computed(() => {
  if (!selectedFood.value)
    return [];

  return selectedFood.value.portionSizeMethods.reduce<StandardUnit[]>((su, psm) => {
    if (psm.method !== 'standard-portion' || !psm.pathways.includes('recipe'))
      return su;

    su.push(...((psm.parameters as PortionSizeParameters['standard-portion']).units));
    return su;
  }, []) ?? [];
});

function updatePSM() {
  const { portionSize } = state.value;

  state.value.portionSize.servingWeight
    = (portionSize.unit?.weight ?? 0)
      * portionSize.quantity
      * coefficient.value
      * portionSize.linkedQuantity;

  console.log(`updated portion size: Serving ${state.value.portionSize.servingWeight}, unitWeight ${portionSize.unit?.weight}, Coeff ${coefficient.value}, quanti ${portionSize.quantity}, linkedQuantity ${portionSize.linkedQuantity}`);
}

function onStepUpdate(index: number) {
  if (selectedFood.value)
    state.value.food = selectedFood.value;

  const step = state.value.steps[index];

  switch (step.type) {
    case 'lookup-unit':
      state.value.portionSize.unit = step.option;
      break;
    case 'quantity':
      state.value.portionSize.quantity = step.quantity;
      break;
  }

  updatePSM();
  stepUpdate(index);
}

onMounted(async () => {
  await resolveStepDependency(0);
});
</script>

<style lang="scss" scoped></style>
