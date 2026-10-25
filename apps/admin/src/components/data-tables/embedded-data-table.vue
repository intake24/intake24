<template>
  <div>
    <v-container fluid>
      <v-row class="justify-center">
        <v-col cols="12" sm>
          <v-text-field
            v-model="filter.search"
            clearable
            density="compact"
            hide-details="auto"
            :label="$t('common.search._')"
            prepend-inner-icon="$search"
            variant="outlined"
            @click:append="setFilter"
            @click:clear="resetFilter"
            @keyup.enter="setFilter"
          />
        </v-col>
        <v-col class="align-self-center" cols="12" sm="auto">
          <slot name="header-append" />
        </v-col>
      </v-row>
    </v-container>
    <v-data-table-server
      v-model="selected"
      v-model:options="options"
      :headers="headers"
      :item-value="trackBy"
      :items="items"
      :items-length="meta.total ?? 0"
      :items-per-page="50"
      :loading="isAppLoading"
      :show-select="showSelect"
    >
      <template v-for="(_, scopedSlotName) in $slots" #[scopedSlotName]="slotData">
        <slot :name="scopedSlotName" v-bind="slotData" />
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { DataTableHeader } from './use-data-table';

import { watchDebounced } from '@vueuse/core';
import { ref } from 'vue';

import { useDataTable } from './use-data-table';

const props = defineProps({
  apiUrl: {
    type: String,
    required: true,
  },
  headers: {
    type: Array as PropType<DataTableHeader[]>,
    required: true,
  },
  showSelect: {
    type: Boolean,
    default: false,
  },
  trackBy: {
    type: String,
    default: 'id',
  },
});

const filter = ref({ search: '' });

const { fetch, items, meta, options, selected } = useDataTable(props, filter);

async function setFilter() {
  await fetch();
}

async function resetFilter() {
  filter.value.search = '';
  await fetch();
}

watchDebounced(
  () => filter.value.search,
  async () => {
    await setFilter();
  },
  { debounce: 500, maxWait: 2000 },
);

defineExpose({ fetch });
</script>

<style lang="scss" scoped></style>
