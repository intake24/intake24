<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2" density="compact">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.yes-no-prompt.useFlag')"
          :model-value="useFlag"
          @update:model-value="update('useFlag', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch
          v-if="showUpdateFoodSwitch"
          :disabled="!validationRequired"
          hide-details="auto"
          :label="$t('survey-schemes.prompts.updateFood')"
          :model-value="updateFood"
          @update:model-value="update('updateFood', $event)"
        />
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-show="useFlag" class="ml-2" density="compact">
        <v-col cols="12" md="6">
          <v-text-field :label="$t('survey-schemes.prompts.yes-no-prompt.flag')" :model-value="flag" @update:model-value="update('flag', $event)" />
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-expand-transition>
      <v-row v-show="showUpdateFoodConfig" class="ml-2" dense>
        <v-col cols="12" md="6">
          <v-text-field
            hide-details="auto"
            :label="$t('survey-schemes.prompts.yes-no-prompt.updateFoodYes')"
            :model-value="updateFoodOptionYes"
            @update:model-value="update('updateFoodOptionYes', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            hide-details="auto"
            :label="$t('survey-schemes.prompts.yes-no-prompt.updateFoodNo')"
            :model-value="updateFoodOptionNo"
            @update:model-value="update('updateFoodOptionNo', $event)"
          />
        </v-col>
      </v-row>
    </v-expand-transition>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'YesNoPrompt',

  mixins: [basePrompt],

  props: {
    useFlag: {
      type: Boolean as PropType<Prompts['yes-no-prompt']['useFlag']>,
      required: true,
    },
    flag: {
      type: String as PropType<Prompts['yes-no-prompt']['flag']>,
      required: false,
    },
    updateFood: {
      type: Boolean as PropType<Prompts['yes-no-prompt']['updateFood']>,
      required: true,
    },
    updateFoodOptionYes: {
      type: String as PropType<Prompts['yes-no-prompt']['updateFoodOptionYes']>,
      required: true,
    },
    updateFoodOptionNo: {
      type: String as PropType<Prompts['yes-no-prompt']['updateFoodOptionNo']>,
      required: true,
    },
    validation: {
      type: Object as PropType<Prompts['yes-no-prompt']['validation']>,
      required: true,
    },
    promptSection: {
      type: String as PropType<PromptSection | undefined>,
      default: undefined,
    },
  },

  computed: {
    validationRequired(): boolean {
      return this.validation.required;
    },
    showUpdateFoodSwitch(): boolean {
      return this.promptSection === 'foods';
    },
    canUseUpdateFood(): boolean {
      return this.showUpdateFoodSwitch && this.validationRequired;
    },
    showUpdateFoodConfig(): boolean {
      return this.updateFood && this.canUseUpdateFood;
    },
  },

  watch: {
    canUseUpdateFood: {
      immediate: true,
      handler(value: boolean) {
        if (!value && this.updateFood)
          this.update('updateFood', false);
      },
    },
  },
});
</script>

<style lang="scss" scoped></style>
