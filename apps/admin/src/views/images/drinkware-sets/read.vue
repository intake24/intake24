<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row>
      <v-col cols="12">
        <v-table>
          <tbody>
            <tr>
              <th>{{ $t('drinkware-sets.id') }}</th>
              <td>{{ entry.id }}</td>
            </tr>
            <tr>
              <th>{{ $t('common.description') }}</th>
              <td>{{ entry.description }}</td>
            </tr>
            <tr>
              <th>{{ $t('guide-images._') }}</th>
              <td>{{ entry.imageMapId }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </layout>
</template>

<script lang="ts">
import type { DrinkwareSetEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'DrinkwareSetDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<DrinkwareSetEntry>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss"></style>
