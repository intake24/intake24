<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row>
      <v-col cols="12" md="6">
        <v-table>
          <tbody>
            <tr>
              <th>{{ $t('as-served-sets.id') }}</th>
              <td>{{ entry.id }}</td>
            </tr>
            <tr>
              <th>{{ $t('common.description') }}</th>
              <td>{{ entry.description }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col cols="12" md="6">
        <v-card-title>{{ $t('as-served-sets.selectionImage') }}</v-card-title>
        <v-img class="ma-2" rounded :src="entry.selectionImageUrl" />
      </v-col>
    </v-row>
    <as-served-images :items="entry.images" readonly :set-id="entry.id" />
  </layout>
</template>

<script lang="ts">
import type { AsServedSetEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

import AsServedImages from './images.vue';

export default defineComponent({
  name: 'AsServedDetail',

  components: { AsServedImages },

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<AsServedSetEntry>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss"></style>
