<template>
  <v-card>
    <v-toolbar :color="title ? 'grey-lighten-4' : 'transparent'" :density>
      <template v-if="title">
        <v-icon color="secondary" end icon="fas fa-list" />
        <v-toolbar-title
          class="font-weight-medium"
          :class="density === 'compact' ? 'text-h6' : density === 'comfortable' ? 'text-h5' : ''"
        >
          {{ $t('common.list.title', { item: pluralize(item) }) }}
        </v-toolbar-title>
      </template>
      <v-spacer />
      <v-btn
        color="primary"
        rounded="pill"
        :size="density === 'compact' ? 'small' : undefined"
        :title="$t('common.list.add', { item: item.toLowerCase() })"
        @click.stop="add"
      >
        <v-icon icon="$add" start />
        {{ $t('common.list.add', { item: item.toLowerCase() }) }}
      </v-btn>
    </v-toolbar>
    <v-card-text v-if="hasStandardItems">
      <v-select
        v-model="items"
        :density
        :items="standardItems"
        :label="$t('common.list.standard', { item: item.toLowerCase() })"
        multiple
      >
        <template #item="{ item, props }">
          <v-list-item v-bind="props" :title="item.raw">
            <template #prepend="{ isSelected, select }">
              <v-list-item-action class="mr-2">
                <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
              </v-list-item-action>
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item, index }">
          <template v-if="index === 0">
            <span v-if="selectedStandardItems.length === 1">
              {{ item.raw }}
            </span>
            <span v-if="selectedStandardItems.length > 1">
              {{ $t('common.selected', { count: selectedStandardItems.length }) }}
            </span>
          </template>
        </template>
      </v-select>
    </v-card-text>
    <v-list class="list-border" :density>
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
      >
        <v-list-item v-for="(item, index) in items" :key="item">
          <template #prepend>
            <v-drag-and-drop-handle />
          </template>
          <v-chip color="info">
            {{ item }}
          </v-chip>
          <template #append>
            <v-list-item-action v-if="!standardItems.includes(item)">
              <v-btn icon="$edit" :title="$t('common.list.edit', { item: item.toLowerCase() })" @click.stop="edit(index, item)" />
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('common.list.remove', { item: item.toLowerCase() })"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: item }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog v-model="editDialog.show" max-width="500px">
      <v-card>
        <v-card-title>
          {{ $t(`common.list.${editDialog.index === -1 ? 'add' : 'edit'}`, { item: item.toLowerCase() }) }}
        </v-card-title>
        <v-form ref="form" validate-on="submit" @submit.prevent="save">
          <v-card-text>
            <v-text-field
              v-model="editDialog.item"
              :density
              :label="hasStandardItems ? $t('common.list.custom', { item: item.toLowerCase() }) : $t('common.list._', { item })"
              name="item"
              :rules
            />
          </v-card-text>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { useVModel } from '@vueuse/core';
import pluralize from 'pluralize';
import { computed, ref, useTemplateRef } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { ConfirmDialog, useI18n } from '@intake24/ui';

type EditDialog = {
  show: boolean;
  index: number;
  item: string;
};

defineOptions({ name: 'CustomList' });

const props = defineProps({
  item: {
    type: String,
    default: 'item',
  },
  density: {
    type: String as PropType<'compact' | 'default' | 'comfortable'>,
    default: 'default',
  },
  modelValue: {
    type: Array as PropType<string[]>,
    required: true,
  },
  standardItems: {
    type: Array as PropType<readonly string[]>,
    default: () => [],
  },
  title: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const form = useTemplateRef('form');

const items = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
const hasStandardItems = computed(() => !!props.standardItems.length);
const selectedStandardItems = computed(() => items.value.filter(item => props.standardItems.includes(item)));

function newEditDialog(show = false): EditDialog {
  return { show, index: -1, item: '' };
}
const editDialog = ref(newEditDialog());

const rules = [
  (value: string | null): boolean | string => {
    if (!value)
      return t('common.list.required');

    const match = items.value.includes(value) || props.standardItems.includes(value);

    return match ? t('common.list.exists', { item: `"${value}""` }) : true;
  },
];

function add() {
  editDialog.value = newEditDialog(true);
};

function edit(index: number, item: string) {
  editDialog.value = { ...newEditDialog(true), index, item };
};

async function save() {
  const { valid } = await form.value?.validate() ?? {};
  if (!valid)
    return;

  const { index, item } = editDialog.value;

  if (index !== -1)
    items.value.splice(index, 1, item);
  else
    items.value.push(item);

  reset();
};

function reset() {
  form.value?.reset();
  editDialog.value = newEditDialog();
};

function remove(index: number) {
  return items.value.splice(index, 1).at(0);
};
</script>

<style lang="scss" scoped>
</style>
