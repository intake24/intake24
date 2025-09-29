<template>
  <v-dialog
    v-model="dialog.show"
    fullscreen
    persistent
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          {{ $t(`fdbs.portionSizes.${dialog.index === -1 ? 'add' : 'edit'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn v-if="!readonly" :title="$t('common.action.ok')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-form ref="form" :readonly @submit.prevent="save">
        <v-container class="dialog-container" :fluid="$vuetify.display.mdAndDown">
          <error-list class="mb-2" v-bind="{ errors }" />
          <v-row>
            <v-col cols="12" md="4">
              <v-card-title class="px-0">
                {{ $t(`fdbs.portionSizes._`) }} {{ $t('fdbs.portionSizes.parameters') }}
              </v-card-title>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="dialog.item.method"
                    hide-details="auto"
                    :items="estimationMethods"
                    :label="$t('fdbs.portionSizes.methods._')"
                    name="method"
                    variant="outlined"
                    @update:model-value="updateItemProps"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="dialog.item.description"
                    hide-details="auto"
                    :items="selections"
                    :label="$t('fdbs.portionSizes.description')"
                    name="description"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-switch
                    v-model="dialog.item.useForRecipes"
                    hide-details="auto"
                    :label="$t('fdbs.portionSizes.useForRecipes')"
                    name="useForRecipes"
                  />
                </v-col>
                <v-col cols="12">
                  <v-slider
                    v-model="dialog.item.conversionFactor"
                    class="mt-5"
                    :label="$t('fdbs.portionSizes.conversionFactor')"
                    :max="10"
                    :min="0.2"
                    name="conversionFactor"
                    :readonly
                    :step="0.1"
                    thumb-label="always"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-divider vertical />
            <v-col cols="12" md>
              <v-card-title class="px-0">
                {{ $t(`fdbs.portionSizes.methods.${dialog.item.method}._`) }}
                {{ $t('fdbs.portionSizes.parameters') }}
              </v-card-title>
              <component
                :is="dialog.item.method"
                v-model="dialog.item.parameters"
                :readonly
                @validate="validate"
              />
            </v-col>
          </v-row>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { InternalPortionSizeMethodItem, PortionSizeMethodDialog } from './portion-sizes';

import { ref, useTemplateRef } from 'vue';

import { copy, merge, randomString } from '@intake24/common/util';
import { ErrorList } from '../../forms';
import portionSizeParams from './parameters';
import { psmDefaults, usePortionSizeMethods } from './portion-sizes';

defineOptions({
  name: 'PortionSizeMethodSelector',
  components: { ...portionSizeParams },
});

defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['save']);

const { estimationMethods, selections } = usePortionSizeMethods();

function newDialog(show = false): PortionSizeMethodDialog {
  return {
    show,
    index: -1,
    item: copy({ ...psmDefaults[0], _id: randomString(6) }),
  };
}

const dialog = ref(newDialog());
const form = useTemplateRef('form');
const errors = ref<string[]>([]);

function updateItemProps() {
  const {
    show,
    index,
    item: { method },
  } = dialog.value;

  const item = psmDefaults.find(item => item.method === method);
  if (!item)
    return;

  dialog.value = { show, index, item: copy({ ...item, _id: randomString(6) }) };
};

function add() {
  dialog.value = newDialog(true);
};

function edit(index: number, item: InternalPortionSizeMethodItem, errorItems: string[]) {
  const defaults = psmDefaults.find(d => d.method === item.method);
  if (!defaults) {
    console.warn(`Portion size method defaults for method '${item.method}' not found.`);
    return;
  }

  dialog.value = { show: true, index, item: copy(merge<InternalPortionSizeMethodItem>(defaults, item)) };
  errors.value = [...errorItems];
};

async function save() {
  const { valid } = await form.value?.validate() ?? {};
  if (!valid)
    return;

  const { index, item } = dialog.value;

  emit('save', { item, index });

  reset();
};

function reset() {
  dialog.value = newDialog();
  form.value?.resetValidation();
};

async function validate() {
  await form.value?.validate();
};

defineExpose({
  add,
  edit,
});
</script>
