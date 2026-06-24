<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <v-card-text>
      <v-form @submit.prevent="submitPrompt">
        <v-row>
          <v-col cols="12" md="auto">
            <v-select
              v-model="state"
              hide-details="auto"
              item-title="label"
              item-value="value"
              :items="localeOptions"
              :label="promptI18n.label"
              min-width="300px"
              :multiple="prompt.multiple"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="submitPrompt" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';
import { useI18n } from '@intake24/ui';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';
import { replaceFoodByCode } from './update-food';

defineOptions({
  name: 'SelectPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps({
  ...createBasePromptProps<'select-prompt'>(),
  modelValue: {
    type: [String, Number, Array] as PropType<string | number | string[] | number[]>,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale, t } } = useI18n();
const { action, customPromptLayout, type } = usePromptUtils(props, { emit });
const survey = useSurvey();

const state = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const promptI18n = computed(() => ({
  label: t(`prompts.${type.value}.label`),
}));

const isValid = computed(() => {
  if (!props.prompt.validation.required)
    return true;

  if (props.prompt.multiple && Array.isArray(state.value))
    return !!state.value.length;

  return typeof state.value !== 'undefined' && state.value !== null;
});
const localeOptions = computed(
  () => props.prompt.options[locale.value] ?? props.prompt.options.en,
);

async function submitPrompt() {
  if (props.prompt.updateFood) {
    const selectedValue = Array.isArray(state.value) ? undefined : state.value;
    const opt = selectedValue === undefined || selectedValue === null
      ? undefined
      : localeOptions.value.find(o => o.value === selectedValue || String(o.value) === String(selectedValue));

    await replaceFoodByCode({
      food: props.food,
      foodCode: opt?.updateFoodValue,
      localeId: survey.localeId,
      replaceFood: data => survey.replaceFood(data),
      source: 'SelectPrompt',
    });
  }

  action('next');
}

defineExpose({ isValid });
</script>

<style lang="scss"></style>
