<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-form ref="form" @submit.prevent>
      <v-expansion-panels v-model="state.panel" :tile="$vuetify.display.mobile">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <i18n-t :keypath="`prompts.${type}.source`" tag="span">
              <template #food>
                <span class="font-weight-medium">{{ foodName }}</span>
              </template>
            </i18n-t>
            <template #actions>
              <expansion-panel-actions :valid="homemadeValid" />
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="d-flex flex-column gr-4">
              <yes-no-toggle
                v-model="state.homemadePrompt"
                class="align-self-start"
                mandatory
                @update:model-value="toggleHomemadePrompt"
              />
              <div v-if="state.homemadePrompt === false">
                <i18n-t class="mb-2" :keypath="`prompts.${type}.brand`" tag="div">
                  <template #food>
                    <span class="font-weight-medium">{{ foodName }}</span>
                  </template>
                </i18n-t>
                <v-text-field
                  v-model="state.info.brand"
                  class="mb-4"
                  hide-details="auto"
                  name="brand"
                  :rules="textFieldRules"
                  @update:model-value="update"
                />
                <i18n-t class="mb-2" :keypath="`prompts.${type}.barcode`" tag="div">
                  <template #food>
                    <span class="font-weight-medium">{{ foodName }}</span>
                  </template>
                </i18n-t>
                <component
                  :is="`${prompt.barcode.type}-input`"
                  v-model:model-value="state.info.barcode"
                  hide-details="auto"
                  name="barcode"
                  :options="prompt.barcode"
                  outlined
                  :rules="barcodeRules"
                />
              </div>
              <i18n-t :keypath="`prompts.${type}.details`" tag="div">
                <template #food>
                  <span class="font-weight-medium">{{ foodName }}</span>
                </template>
              </i18n-t>
              <v-textarea
                v-model="state.info.description"
                hide-details="auto"
                name="description"
                :rules="textFieldRules"
                @update:model-value="update"
              />
              <v-btn
                v-if="state.homemadePrompt !== undefined"
                :class="$vuetify.display.mobile ? 'align-self-stretch' : 'align-self-start'"
                color="primary"
                :disabled="!homemadeValid"
                @click="confirm"
              >
                {{ $t('common.action.continue') }}
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>
            <i18n-t :keypath="`prompts.${type}.portionSize`" tag="span">
              <template #food>
                <span class="font-weight-medium">{{ foodName }}</span>
              </template>
            </i18n-t>
            <template #actions>
              <expansion-panel-actions :valid="!!state.info.portionSize" />
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-textarea
              v-model="state.info.portionSize"
              class="mb-4"
              hide-details="auto"
              name="portionSize"
              :rules="textFieldRules"
              @update:model-value="update"
            />
            <v-btn
              :block="$vuetify.display.mobile"
              color="primary"
              :disabled="!portionSizeValid"
              @click="confirm"
            >
              {{ $t('common.action.continue') }}
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-form>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { MissingFood } from '@intake24/common/surveys';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions, YesNoToggle } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { barcodes } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next, useForm, usePanel } from '../partials';
import { createPortionPromptProps } from '../prompt-props';

defineOptions({ components: { ...barcodes } });

const props = defineProps(createPortionPromptProps<'missing-food-prompt', MissingFood>());

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { foodName } = useFoodUtils(props);

const { form, inputTooLog } = useForm();

const formErrors = computed(() => form.value?.errors ?? []);
const barcodeRules = computed(() => [inputTooLog(128)]);
const textFieldRules = computed(() => [inputTooLog(1024)]);

const state = ref(copy({
  ...props.modelValue,
  homemadePrompt:
          !props.modelValue.info.description && !props.modelValue.info.brand
            ? undefined
            : !props.modelValue.info.brand,
}));

const homemadeValid = computed(() => (
  formErrors.value.every(error => typeof error !== 'string' && !['description', 'brand', 'barcode'].includes(error.id.toString()))
  && ((state.value.homemadePrompt === true && !!state.value.info.description)
    || (state.value.homemadePrompt === false && (!!state.value.info.brand || !!state.value.info.description)))
));
const portionSizeValid = computed(() => !!state.value.info.portionSize
  && formErrors.value.every(error => typeof error !== 'string' && !['portionSize'].includes(error.id.toString())));

const validConditions = computed(() => [!!form.value?.isValid, homemadeValid.value, portionSizeValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

function confirm() {
  updatePanel();
};

function toggleHomemadePrompt(value: boolean) {
  if (value) {
    state.value.info.brand = null;
    state.value.info.barcode = null;
  }

  update();
};

function update() {
  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
