<template>
  <entry-layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row class="justify-space-between py-4">
      <v-col cols="5" lg="4">
        <food-explorer :id :code :readonly />
      </v-col>
      <v-col cols="7" lg="8">
        <router-view v-slot="{ Component }" :style="listItemStyle">
          <v-scroll-y-transition mode="out-in">
            <component :is="Component" :code :readonly />
          </v-scroll-y-transition>
        </router-view>
      </v-col>
    </v-row>
  </entry-layout>
</template>

<script lang="ts" setup>
import type { LocaleEntry } from '@intake24/common/types/http/admin';

import { computed, onUpdated, shallowRef } from 'vue';

import { FoodExplorer } from '@intake24/admin/components/fdbs';
import { EntryLayout } from '@intake24/admin/components/layouts';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

defineOptions({ name: 'FoodDBDetail' });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  entryId: {
    type: String,
  },
});

useEntryFetch(props);
const { entry, entryLoaded, canHandleEntry } = useEntry<LocaleEntry>(props);

const code = computed(() => entry.value.code);
const readonly = computed(() => !canHandleEntry('food-list:edit'));

const listItemViewOffset = shallowRef();
const listItemStyle = computed(() => {
  return {
    minHeight: '192px',
    height: `calc(100vh - ${listItemViewOffset.value}px)`,
    overflowY: 'auto',
  };
});

onUpdated(() => {
  // retrieve height of following elements to offset
  listItemViewOffset.value = (document.getElementById('header')?.offsetHeight || 0)
    + (document.getElementById('footer')?.offsetHeight || 0)
    + (document.getElementById('entryBreadcrumb')?.offsetHeight || 0)
    + (document.getElementById('entryTabs')?.offsetHeight || 0);
});
</script>
