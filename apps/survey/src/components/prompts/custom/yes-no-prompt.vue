<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <template #actions>
      <yes-no-choice v-model="state" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { YesNoChoice } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { createBasePromptProps } from '../prompt-props';
import { replaceFoodByCode } from './update-food';

defineOptions({
  name: 'YesNoPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps({
  ...createBasePromptProps<'yes-no-prompt'>(),
  modelValue: {
    type: Boolean,
    default: undefined,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, customPromptLayout } = usePromptUtils(props, { emit });
const survey = useSurvey();

const isValid = computed(() => props.modelValue !== undefined);
const state = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);

    if (typeof value === 'boolean')
      void submitPrompt(value);
  },
});

async function submitPrompt(value: boolean) {
  if (props.prompt.updateFood) {
    const foodCode = value ? props.prompt.updateFoodOptionYes : props.prompt.updateFoodOptionNo;

    await replaceFoodByCode({
      food: props.food,
      foodCode,
      localeId: survey.localeId,
      replaceFood: data => survey.replaceFood(data),
      source: 'YesNoPrompt',
    });
  }

  action('next');
}

defineExpose({ isValid });
</script>

<style lang="scss" scoped></style>
