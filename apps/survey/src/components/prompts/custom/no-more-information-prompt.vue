<template>
  <component
    :is="customPromptLayout"
    v-bind="{ food, meal, prompt, section, isValid }"
    @action="action"
  >
    <template #actions>
      <template v-if="isFood">
        <confirm-dialog
          :label="$t('recall.menu.food.delete')"
          @confirm="action('deleteFood', food?.id)"
        >
          <template #activator="{ props }">
            <v-btn
              :title="$t('recall.actions.deleteFood')"
              v-bind="props"
            >
              <v-icon icon="$delete" start />
              {{ $t('recall.actions.deleteFood') }}
            </v-btn>
          </template>
          <i18n-t keypath="recall.menu.food.deleteConfirm">
            <template #item>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
        </confirm-dialog>
        <v-btn
          :title="$t('recall.actions.editFood')"
          @click.stop="action('editFood', food?.id)"
        >
          <v-icon icon="$edit" start />
          {{ $t('recall.actions.editFood') }}
        </v-btn>
      </template>
      <template v-if="isMeal">
        <confirm-dialog
          :label="$t('recall.menu.meal.delete')"
          @confirm="action('deleteMeal', meal?.id)"
        >
          <template #activator="{ props }">
            <v-btn
              :title="$t('recall.actions.deleteMeal')"
              v-bind="props"
            >
              <v-icon icon="$delete" start />
              {{ $t('recall.actions.deleteMeal') }}
            </v-btn>
          </template>
          <i18n-t keypath="recall.menu.meal.deleteConfirm">
            <template #item>
              <span class="font-weight-medium">{{ mealName }}</span>
            </template>
          </i18n-t>
        </confirm-dialog>
        <v-btn
          :title="$t('recall.actions.editMeal')"
          @click.stop="action('editMeal', meal?.id)"
        >
          <v-icon icon="$add" start />
          {{ $t('recall.actions.editMeal') }}
        </v-btn>
      </template>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { usePromptUtils } from '@intake24/survey/composables';
import { ConfirmDialog } from '@intake24/ui';

import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'NoMoreInformationPrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps(createBasePromptProps<'no-more-information-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

const {
  action,
  customPromptLayout,
  foodName,
  isFood,
  isMeal,
  mealName,
} = usePromptUtils(props, { emit });

const isValid = true;
defineModel('modelValue', { type: String, default: 'next' });

defineExpose({ isValid });
</script>

<style lang="scss" scoped></style>
