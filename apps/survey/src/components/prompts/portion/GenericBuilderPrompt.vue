<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.activeStep" :tile="$vuetify.display.mobile" @update:model-value="updateActiveStep">
      <v-expansion-panel v-for="(step, index) in state.steps" :key="step.id">
        <v-expansion-panel-title>
          <div>
            <v-avatar class="me-2" color="primary" size="28">
              <span class="text-white font-weight-medium">{{ index + 1 }}</span>
            </v-avatar>
            {{ translate(step.name) }}
          </div>
          <template #actions>
            <expansion-panel-actions :valid="isStepValid(step)" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-sheet class="mb-4">
            {{ translate(step.description) }}
          </v-sheet>
          <component
            :is="`${step.type}-step`"
            v-model="state.steps[index]"
            v-bind="{
              step: food.template.steps[index],
            }"
            @update:model-value="stepUpdate(index)"
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
import type { PropType } from 'vue';

import type { FoodBuilderCoefficientStepState, FoodBuilderConditionStepState, FoodBuilderLookupStepState, PromptStates } from '@intake24/common/prompts';
import type { GenericBuilder } from '@intake24/common/surveys';
import type { UserFoodData } from '@intake24/common/types/http';
import type { FoodBuilderStepType } from '@intake24/common/types/http/admin';

import { computed, onMounted, ref, watch } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { evaluateCondition } from '@intake24/survey/dynamic-recall/prompt-manager';
import { categoriesService, foodsService } from '@intake24/survey/services';
import { getEntityId } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { getNextStep, isStepValid, steps } from './builder-steps';

defineOptions({
  components: { ...steps },
});

const props = defineProps({
  ...createPortionPromptProps<'generic-builder-prompt', GenericBuilder>(),
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
  modelValue: {
    type: Object as PropType<PromptStates['generic-builder-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { translate } = useI18n();
const { action } = usePromptUtils(props, { emit });

const state = ref(copy(props.modelValue));
const foods = ref<UserFoodData[]>([]);

const allConfirmed = computed(() => state.value.steps.every(step => isStepValid(step)));
const isValid = computed(() => allConfirmed.value);

function goToNextIfCan(index: number) {
  if (!isStepValid(state.value.steps[index]))
    return;

  state.value.activeStep = getNextStep(state.value.steps);
};

// function depsResolution<T extends FoodBuilderStepType = FoodBuilderStepType>(): Record<T, (step: GetFoodBuilderStep<T>) => Promise<void>> {
const depsResolution: Record<FoodBuilderStepType, (step: any, foodData: UserFoodData[]) => Promise<UserFoodData[]>> = {
  coefficient: async (step: FoodBuilderCoefficientStepState, foodData: UserFoodData[]) => {
    return foodData;
  },
  condition: async (step: FoodBuilderConditionStepState, foodData: UserFoodData[]) => {
    if (!step.option)
      return foodData;

    return foodData.filter(food => step.option.some(condition => evaluateCondition(condition, {
      food: {
        id: getEntityId(),
        type: 'encoded-food',
        data: food,
        searchTerm: 'generic-builder-condition',
        flags: [],
        linkedFoods: [],
        customPromptAnswers: {},
        portionSizeMethodIndex: null,
        portionSize: null,
      },
    })));
  },
  ingredient: async (step: any, foodData: UserFoodData[]) => {
    return foodData;
  },
  lookup: async (step: FoodBuilderLookupStepState, foodData: UserFoodData[]) => {
    if (!step.option)
      return foodData;

    const data = await categoriesService.contents(props.localeId, step.option);

    return await Promise.all(
      data.foods.map(({ code }) => foodsService.getData(props.localeId, code)),
    );
  },
};

async function clearNextSteps(index: number) {
  for (let i = index + 1; i < state.value.steps.length; i++) {
    const step = state.value.steps[i];
    switch (step.type) {
      case 'coefficient':
      case 'condition':
      case 'lookup':
        step.option = null;
        break;
      case 'ingredient':
        step.foods = [];
        step.confirmed = undefined;
        step.anotherFoodConfirmed = undefined;
        break;
    }
  }
};

async function resolveStepDependency(index: number) {
  let items: UserFoodData[] = copy(foods.value);
  for (let i = index; i < state.value.steps.length; i++) {
    const step = state.value.steps[i];
    console.log('Filtering foods with step', step.name);

    if (!isStepValid(step)) {
      console.log('Step not valid, stopping filtering', step.name);
      break;
    }

    items = await depsResolution[step.type](step, items);
  }

  foods.value = items;
};

async function stepUpdate(index: number) {
  console.log('stepUpdate', index);
  await clearNextSteps(index);
  await resolveStepDependency(index);
  goToNextIfCan(index);
  update();
};

function update() {
  emit('update:modelValue', state.value);
};

function updateActiveStep(index: number) {
  console.log('updateActiveStep', index);
  update();
};

watch(() => foods, (newValue) => {
  console.log('Foods updated', newValue.value.length);
}, { deep: true });

onMounted(async () => {
  await resolveStepDependency(0);
});
</script>

<style lang="scss" scoped></style>
