<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row class="pa-4" justify="space-between">
      <v-col cols="5" lg="4" xl="3">
        <food-explorer :id :code :readonly />
      </v-col>
      <v-divider vertical />
      <v-col cols="7" lg="8" xl="8">
        <router-view v-slot="{ Component }">
          <v-scroll-y-transition mode="out-in">
            <component :is="Component" :code :readonly />
          </v-scroll-y-transition>
        </router-view>
      </v-col>
    </v-row>
  </layout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Layout } from '@intake24/admin/components/entry';
import { FoodExplorer } from '@intake24/admin/components/fdbs';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { LocaleEntry } from '@intake24/common/types/http/admin';

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
</script>
