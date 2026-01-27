<template>
  <v-card>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-list" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('common.list.title', { item: pluralize(item) }) }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="d-flex flex-column gr-4">
      <v-select
        v-if="hasStandardItems"
        v-model="items"
        hide-details="auto"
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
      <v-form ref="form" validate-on="submit" @submit.prevent="add">
        <v-text-field
          v-model="custom"
          clearable
          hide-details="auto"
          :label="hasStandardItems ? $t('common.list.custom', { item: item.toLowerCase() }) : $t('common.list._', { item })"
          outlined
          :rules="rules"
        >
          <template #append-inner>
            <v-btn
              v-if="custom"
              color="primary"
              rounded="pill"
              size="small"
              :title="$t('common.action.add')"
              @click="add"
            >
              <v-icon icon="$add" />
              {{ $t('common.action.add') }}
            </v-btn>
          </template>
        </v-text-field>
      </v-form>
    </v-card-text>
    <v-list class="list-border">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
      >
        <v-list-item v-for="(item, index) in items" :key="item">
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-chip color="info">
            {{ item }}
          </v-chip>
          <template #append>
            <v-list-item-action v-if="!standardItems.includes(item) && !custom">
              <v-btn icon="$edit" :title="$t('common.list.edit', { item: item.toLowerCase() })" @click.stop="edit(index)" />
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
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { useVModel } from '@vueuse/core';
import pluralize from 'pluralize';
import { computed, ref, useTemplateRef } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { ConfirmDialog, useI18n } from '@intake24/ui';

defineOptions({ name: 'CustomList' });

const props = defineProps({
  item: {
    type: String,
    default: 'item',
  },
  modelValue: {
    type: Array as PropType<string[]>,
    required: true,
  },
  standardItems: {
    type: Array as PropType<readonly string[]>,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const form = useTemplateRef('form');

const items = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
const hasStandardItems = computed(() => !!props.standardItems.length);
const selectedStandardItems = computed(() => items.value.filter(item => props.standardItems.includes(item)));
const custom = ref('');

const rules = [
  (value: string | null): boolean | string => {
    if (!value)
      return t('survey-schemes.meals.validation.required');

    const match = items.value.includes(value) || props.standardItems.includes(value);

    return match ? t('survey-schemes.meals.validation.unique') : true;
  },
];

async function add() {
  const { valid } = await form.value?.validate() ?? {};
  if (!valid)
    return;

  items.value.push(custom.value);
  custom.value = '';
  form.value?.reset();
};

function remove(index: number) {
  return items.value.splice(index, 1).at(0);
};

function edit(index: number) {
  custom.value = remove(index) ?? '';
};
</script>

<style lang="scss" scoped>
</style>
