<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <template #prompt-description>
      <div class="px-4 pt-4" v-html="promptI18n.description" />
    </template>
    <v-card-text class="pt-2">
      <v-row>
        <v-col cols="12" md="8">
          <v-form ref="form" @submit.prevent="submit">
            <component
              :is="prompt.custom ? 'v-combobox' : 'v-select'"
              v-model="state"
              v-model:search-input="state"
              autofocus
              class="meal-add-prompt__combobox"
              clearable
              hide-details="auto"
              :items="availableMeals"
              :label="promptI18n.label"
              outlined
              :rules="rules"
            />
          </v-form>
        </v-col>
      </v-row>
    </v-card-text>
    <template #actions>
      <v-btn
        :disabled="!hasMeals"
        :title="promptI18n.no"
        @click.stop="action('cancel')"
      >
        <v-icon icon="$cancel" start />
        {{ promptI18n.no }}
      </v-btn>
      <v-btn
        :disabled="!isValid"
        :title="promptI18n.yes"
        @click="action('next')"
      >
        <v-icon icon="$add" start />
        {{ promptI18n.yes }}
      </v-btn>
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed } from 'vue';
import { VCombobox, VSelect } from 'vuetify/components';

import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { CardLayout } from '../layouts';
import { useForm } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({ components: { VCombobox, VSelect } });

const props = defineProps({
  ...createBasePromptProps<'meal-add-prompt'>(),
  defaultMeals: {
    type: Array as PropType<string[]>,
    required: true,
  },
  meals: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { t }, translatePath } = useI18n();
const { action, params, type } = usePromptUtils(props, { emit });
const { form, inputTooLog, submit } = useForm({ action });

const state = defineModel('modelValue', { type: String });

const isValidMeal = (value: any) => !props.prompt.unique || !props.meals.includes(value?.toLowerCase().trim());
const availableMeals = computed(() => props.defaultMeals.filter(meal => isValidMeal(meal)));
const hasMeals = computed(() => !!props.meals.length);
const isValid = computed(() => !!form.value?.isValid && !!state.value && isValidMeal(state.value));

const i18nPrefix = computed(
  () => `prompts.${type.value}${props.prompt.custom ? '.custom' : ''}`,
);
const promptI18n = computed(() => ({
  exists: t(`prompts.${type.value}.exists`),
  no: t(`prompts.${type.value}.no`),
  yes: t(`prompts.${type.value}.yes`),
  description: translatePath(`${i18nPrefix.value}.description`, params.value, true),
  label: t(`${i18nPrefix.value}.label`),
}));

const rules = [
  inputTooLog(64),
  (value: any): boolean | string => isValidMeal(value) || promptI18n.value.exists.toString(),
];
</script>

<style lang="scss">
.meal-add-prompt__combobox {
  .v-input__append-inner .v-input__icon.v-input__icon--append .v-icon {
    font-size: 30px;
  }
}
</style>
