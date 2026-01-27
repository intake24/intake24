<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn color="primary" icon="$add" size="small" :title="$t('fdbs.nutrients.add')" v-bind="props" />
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('fdbs.nutrients.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-6 d-flex flex-column gr-4">
        <v-select
          v-model="selectedTableId"
          item-title="description"
          item-value="id"
          :items="nutrientTables"
          :label="$t('nutrient-tables._')"
          name="selectedTableId"
          @update:model-value="fetch"
        />
        <v-text-field
          v-model="search"
          clearable
          :label="$t('common.search._')"
          :loading="loading"
          prepend-inner-icon="$search"
          @click:clear="clear"
        />
        <v-alert v-if="isAlreadyIncluded" type="error">
          {{ $t('fdbs.nutrients.alreadyIncluded', { id: selected.at(0)?.id }) }}
        </v-alert>
        <template v-if="items.length">
          <v-list v-model:selected="selected" class="list-border" density="compact" min-height="350px">
            <v-list-item v-for="item in items" :key="item.id" :value="item">
              <template #prepend="{ isSelected, select }">
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                </v-list-item-action>
                <v-icon icon="fas fa-list" />
              </template>
              <v-list-item-title>
                {{ item.nutrientTableRecordId }} | {{ item.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <div class="text-center">
            <v-pagination v-model="page" :length="lastPage" rounded />
          </div>
        </template>
        <v-alert v-else color="secondary" type="info">
          {{ $t('fdbs.nutrients.none') }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="close">
          <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          :disabled="!isSelected || isAlreadyIncluded"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start />{{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type {
  FoodDatabaseRefs,
  NutrientTableRecordAttributes,
  NutrientTableRecordReference,
} from '@intake24/common/types/http/admin';

import { computed, ref } from 'vue';

import { useFetchList } from '@intake24/admin/composables';
import { copy } from '@intake24/common/util';

defineOptions({ name: 'AddNutrientDialog' });

const props = defineProps({
  currentItems: {
    type: Array as PropType<NutrientTableRecordAttributes[]>,
    required: true,
  },
  nutrientTables: {
    type: Array as PropType<FoodDatabaseRefs['nutrientTables']>,
    required: true,
  },
});

const emit = defineEmits(['add']);

const selected = ref<NutrientTableRecordAttributes[]>([]);
const selectedTableId = ref(props.nutrientTables.length ? props.nutrientTables[0].id : ':id');

const { dialog, loading, page, lastPage, search, items, fetch, clear } = useFetchList<
  NutrientTableRecordReference
>({ url: 'admin/references/nutrient-tables/:id/records', id: selectedTableId });

const isSelected = computed(() => !!selected.value.length);
const isAlreadyIncluded = computed(() => {
  if (!props.currentItems.length || !selected.value.length)
    return false;

  return !!props.currentItems.find(item => item.id === selected.value.at(0)?.id);
});

function close() {
  selected.value = [];
  dialog.value = false;
};

function confirm() {
  if (!selected.value.length)
    return;

  emit('add', copy(selected.value.at(0)));
  close();
};
</script>
