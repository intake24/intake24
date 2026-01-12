<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <v-card-text class="pt-2">
      <v-form ref="form" @submit.prevent>
        <v-radio-group
          v-model="selected"
          hide-details="auto"
          :inline="prompt.orientation === 'row'"
          :label="$t(`prompts.${type}.label`)"
          @update:model-value="update"
        >
          <v-radio
            v-for="option in localeOptions"
            :key="option.value"
            class="my-1 selection-control__start"
            :label="option.label"
            :value="option.value"
          />
          <div v-if="prompt.other" class="d-flex flex-row align-center my-1">
            <v-radio class="flex-grow-0" hide-details value="other" />
            <v-text-field
              v-model.trim="otherValue"
              hide-details="auto"
              :label="$t(`prompts.${type}.other`)"
              name="other"
              :rules="otherRules"
              @change="update"
              @focus="selected = 'other'"
            />
          </div>
        </v-radio-group>
      </v-form>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';
import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next, useForm } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'RadioListPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps({
  ...createBasePromptProps<'radio-list-prompt'>(),
  modelValue: {
    type: String as PropType<string>,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale } } = useI18n();
const { action, customPromptLayout, type } = usePromptUtils(props, { emit });
const { form, inputTooLog } = useForm({ action });

const otherValue = ref('');
const otherRules = computed(() => [inputTooLog(256)]);
const selected = ref(props.modelValue);

const state = computed(() =>
  selected.value === 'other' ? `Other: ${otherValue.value}` : selected.value,
);
const isValid = computed(
  () => !!form.value?.isValid
    && (!props.prompt.validation.required || (!!state.value && (selected.value !== 'other' || !!otherValue.value))),
);
const localeOptions = computed(
  () => props.prompt.options[locale.value] ?? props.prompt.options.en,
);

function update() {
  emit('update:modelValue', state.value);
}

defineExpose({ isValid });
</script>

<style lang="scss">
.selection-control__start {
  .v-selection-control__wrapper {
    align-self: flex-start;
  }
}
</style>
