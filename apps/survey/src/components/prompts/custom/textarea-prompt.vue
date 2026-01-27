<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <v-card-text class="pt-2">
      <v-form ref="form" @submit.prevent="submit">
        <v-textarea
          v-model="state"
          hide-details="auto"
          :hint="translate(prompt.i18n.hint)"
          :label="translate(prompt.i18n.label)"
          :rules="rules"
        />
      </v-form>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next, useForm } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'TextareaPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps(createBasePromptProps<'textarea-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { t }, translate } = useI18n();
const { action, customPromptLayout, type } = usePromptUtils(props, { emit });
const { form, inputTooLog, submit } = useForm({ action });

const state = defineModel('modelValue', { type: String });
const isValid = computed(() => !!form.value?.isValid && (!props.prompt.validation.required || !!state.value));

const rules = computed(() => {
  const items = [inputTooLog(512)];

  if (props.prompt.validation.required) {
    items.push((v: string | null) =>
      !!v
      || (translate(props.prompt.validation.message)
        ?? t(`prompts.${type.value}.validation.required`)));
  }

  return items;
});

defineExpose({ isValid });
</script>

<style lang="scss" scoped></style>
