<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row class="pa-4" justify="space-between">
      <v-col cols="5" lg="4" xl="3">
        <food-explorer :locale-id="id" :readonly />
      </v-col>
      <v-divider vertical />
      <v-col cols="7" lg="8" xl="8">
        <router-view v-slot="{ Component }">
          <v-scroll-y-transition mode="out-in">
            <component :is="Component" :readonly />
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
import { useUser } from '@intake24/admin/stores';

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

const user = useUser();
const readonly = computed(() => !user.can({ action: 'food-list:edit' }));

useEntryFetch(props);
const { entry, entryLoaded } = useEntry(props);
</script>
