<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.panel" :tile="$vuetify.display.mobile">
      <v-expansion-panel :readonly="portionSizeMethods.length === 1">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.method`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="psmValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <portion-size-methods
            v-bind="{ foodName, modelValue: food.portionSizeMethodIndex, portionSizeMethods }"
            @update:model-value="action('changeMethod', $event)"
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
import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import { Next, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({ ...createPortionPromptProps<'unknown-prompt'>() });

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { psmValid } = usePortionSizeMethod<'unknown'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const validConditions = computed(() => {
  const conditions = [psmValid.value];

  return conditions;
});
const isValid = computed(() => validConditions.value.every(condition => condition));

usePanel(state, validConditions);
</script>

<style lang="scss" scoped></style>
