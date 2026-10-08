<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text class="pt-2">
      <v-alert
        v-if="rejected"
        class="mb-4"
        :text="promptI18n.rejected"
        type="warning"
      />
      <v-textarea
        v-model="state"
        auto-grow
        autofocus
        :disabled="loading"
        hide-details="auto"
        :label="promptI18n.label"
        :maxlength="2000"
        rows="3"
        variant="outlined"
      />
    </v-card-text>
    <template #actions>
      <v-btn
        v-if="!meal.flags.includes('meal-time:disabled')"
        :disabled="loading"
        :title="$t('recall.actions.mealTime')"
        @click="action('mealTime', meal.id)"
      >
        <v-icon icon="fas fa-clock" start />
        {{ $t('recall.actions.mealTime') }}
      </v-btn>
      <confirm-dialog
        :label="$t('recall.menu.meal.delete')"
        @confirm="action('deleteMeal', meal.id)"
      >
        <template #activator="{ props: activatorProps }">
          <v-btn
            :disabled="loading"
            :title="$t('recall.actions.deleteMeal')"
            v-bind="activatorProps"
          >
            <v-icon icon="$delete" start />
            {{ $t('recall.actions.nav.deleteMeal') }}
          </v-btn>
        </template>
        <i18n-t keypath="recall.menu.meal.deleteConfirm" tag="span">
          <template #item>
            <span class="font-weight-medium">{{ mealName }}</span>
          </template>
        </i18n-t>
      </confirm-dialog>
      <next :disabled="!isValid" :loading="loading" @click="action('next')" />
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useMealUtils, usePromptUtils } from '@intake24/survey/composables';
import { ConfirmDialog } from '@intake24/ui';

import { CardLayout } from '../layouts';
import { Next } from '../partials';
import { createMealPromptProps } from '../prompt-props';

const props = defineProps({
  ...createMealPromptProps<'meal-description-prompt'>(),
  loading: {
    type: Boolean,
    default: false,
  },
  rejected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { mealName } = useMealUtils(props);
const { action, translatePrompt } = usePromptUtils(props, { emit });

const state = defineModel('modelValue', { type: String, required: true });

const isValid = computed(() => !props.loading && !!state.value.trim().length);
const promptI18n = computed(() => translatePrompt(['label', 'rejected']));
</script>

<style lang="scss" scoped></style>
