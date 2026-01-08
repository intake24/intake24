<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="filter.search"
          clearable
          hide-details="auto"
          :label="$t('common.search._')"
          prepend-inner-icon="$search"
          variant="outlined"
          @click:clear="resetFilter"
          @click:prepend="setFilter"
          @keyup.enter="setFilter"
        />
      </v-col>
    </v-row>
    <v-row justify="space-between">
      <v-col col="12" sm="auto">
        {{ $t('common.search.filter') }}:
        <v-chip v-for="item in items" :key="item" class="mr-1" color="info" pill>
          {{ item }}
        </v-chip>
      </v-col>
      <v-col col="12" sm="auto">
        {{ $t('common.search.count') }}:
        <span>{{ count }}</span>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { watchDebounced } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { computed, defineComponent, ref, watch } from 'vue';

import { useResource } from '@intake24/admin/stores';
import type { Dictionary } from '@intake24/common/types';

export default defineComponent({
  name: 'DataTableFilter',

  props: {
    count: {
      type: Number,
      default: 0,
    },
  },

  emits: ['filterSet', 'filterReset'],

  setup(props, { emit }) {
    const { getFilter } = useResource();

    const items = ref<string[]>([]);
    const defaults = ref({ search: '' });
    const filter = ref<Dictionary>({ ...getFilter });

    const currentSearch = computed(() => filter.value.search);

    const refreshItems = () => {
      items.value = [...Object.values(filter.value)].filter(item => item);
    };

    const setFilter = () => {
      refreshItems();
      emit('filterSet', filter.value);
    };
    const resetFilter = () => {
      emit('filterReset');
    };

    watch(
      () => getFilter.value,
      (val) => {
        filter.value = { ...(isEmpty(val) ? defaults.value : val) };
        refreshItems();
      },
    );

    watchDebounced(
      currentSearch,
      () => {
        setFilter();
      },
      { debounce: 500, maxWait: 2000 },
    );

    return {
      items,
      defaults,
      filter,
      setFilter,
      resetFilter,
    };
  },
});
</script>

<style lang="scss" scoped></style>
