<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('survey-schemes.prompts.linkedQuantity.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-subtitle>
      {{ $t('survey-schemes.prompts.linkedQuantity.subtitle') }}
    </v-card-subtitle>
    <v-card-text>
      <v-switch
        v-model="linkedQuantity.auto"
        hide-details="auto"
        :label="$t('survey-schemes.prompts.linkedQuantity.auto')"
      />
    </v-card-text>
    <category-list
      class="mb-6"
      flat
      :model-value="linkedQuantity.source.map((code) => ({ code, name: code }))"
      tile
      @update:model-value="updateLQSource"
    >
      <template #title>
        {{ $t('survey-schemes.prompts.linkedQuantity.source') }}
      </template>
      <template #[`item.content`]="{ item }">
        <v-list-item-title>
          {{ $t('fdbs.categories._') }}: {{ item.code }}
        </v-list-item-title>
      </template>
    </category-list>
    <category-list
      flat
      :model-value="linkedQuantity.parent.map((item) => ({ name: item.code, ...item }))"
      tile
      @update:model-value="updateLQParent"
    >
      <template #title>
        {{ $t('survey-schemes.prompts.linkedQuantity.parent') }}
      </template>
      <template #[`item.content`]="{ item }">
        <v-list-item-title>
          {{ $t('fdbs.categories._') }}: {{ item.code }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ $t('standard-units._') }}: {{ item.unit ?? $t('common.not.assigned') }}
        </v-list-item-subtitle>
      </template>
      <template #[`item.action`]="{ item }">
        <select-resource
          item-name="id"
          resource="standard-units"
          @update:model-value="updateLQUnit(item.code, $event)"
        >
          <template #activator="{ props }">
            <v-btn icon="$standard-units" v-bind="props" :title="$t('standard-units.add')" />
          </template>
        </select-resource>
      </template>
    </category-list>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { LinkedQuantity } from '@intake24/common/prompts';
import type { CategoryReference } from '@intake24/common/types/http/admin';

import { useVModel } from '@vueuse/core';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { CategoryList } from '@intake24/admin/components/fdbs';

const props = defineProps({
  modelValue: {
    type: Object as PropType<LinkedQuantity>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const linkedQuantity = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

function updateLQParent(items: CategoryReference[]) {
  linkedQuantity.value.parent = items.map(({ code }) => ({ code }));
}

function updateLQSource(items: CategoryReference[]) {
  linkedQuantity.value.source = items.map(({ code }) => code);
}

function updateLQUnit(code: string, unit: string) {
  const idx = linkedQuantity.value.parent.findIndex(cat => cat.code === code);
  if (idx === -1)
    return;

  parent.splice(idx, 1, { code, unit });
}
</script>

<style lang="scss" scoped></style>
