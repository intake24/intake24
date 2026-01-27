<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <v-card-text class="pt-2">
      <v-form ref="form" @submit.prevent>
        <v-label v-if="$t(`prompts.${type}.label`)">
          {{ $t(`prompts.${type}.label`) }}
        </v-label>
        <v-checkbox
          v-for="option in localeOptions"
          :key="option.value"
          v-model="selected"
          density="comfortable"
          :disabled="disableOption(option.value)"
          hide-details="auto"
          :label="option.label"
          :name="`option-${option.value}`"
          :value="option.value"
          @update:model-value="update(option)"
        />
        <div v-if="prompt.other" class="d-flex flex-row align-center">
          <v-checkbox
            v-model="otherEnabled"
            class="flex-grow-0"
            density="comfortable"
            :disabled="disableOption(otherOutput)"
            hide-details
            name="other-control"
          />
          <v-text-field
            v-model.trim="otherValue"
            hide-details="auto"
            :label="$t(`prompts.${type}.other`)"
            name="other"
            :rules="otherRules"
            @change="update"
          />
        </div>
      </v-form>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { ListOption } from '@intake24/common/types';

import { computed, ref, watch } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next, useForm } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'CheckboxListPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps({
  ...createBasePromptProps<'checkbox-list-prompt'>(),
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => [] as string[],
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale } } = useI18n();
const { action, customPromptLayout, type } = usePromptUtils(props, { emit });
const { form, inputTooLog } = useForm({ action });

const otherEnabled = ref(false);
const otherValue = ref('');
const otherOutput = computed(() => otherValue.value.length ? `Other: ${otherValue.value}` : '');
const otherRules = computed(() => [inputTooLog(256)]);

const selected = ref(Array.isArray(props.modelValue) ? props.modelValue : []);
const state = computed(() => [...selected.value, otherOutput.value].filter(Boolean));

const localeOptions = computed(
  () => props.prompt.options[locale.value] ?? props.prompt.options.en,
);
const isExclusiveSelected = computed(() => !!localeOptions.value.find(option => option.exclusive && props.modelValue.includes(option.value)));
const isMinSatisfied = computed(() => !props.prompt.validation.min || props.modelValue.length >= props.prompt.validation.min);
const isMaxSatisfied = computed(() => !props.prompt.validation.max || props.modelValue.length <= props.prompt.validation.max);
const isRequiredSatisfied = computed(() => !props.prompt.validation.required || !!props.modelValue.length);
const isValid = computed(() =>
  !!form.value?.isValid && isRequiredSatisfied.value
  && (isExclusiveSelected.value || (isMinSatisfied.value && isMaxSatisfied.value)),
);

function disableOption(value: string) {
  return !props.modelValue.includes(value)
    && (isExclusiveSelected.value || (!!props.prompt.validation.max && props.modelValue.length === props.prompt.validation.max));
}

function update(option?: ListOption) {
  if (option?.exclusive && selected.value.includes(option.value)) {
    selected.value = [option.value];
    otherEnabled.value = false;
  }

  emit('update:modelValue', [...state.value]);
}

watch(otherEnabled, (val) => {
  if (!val)
    otherValue.value = '';

  update();
});

defineExpose({ isValid });
</script>

<style lang="scss" scoped></style>
