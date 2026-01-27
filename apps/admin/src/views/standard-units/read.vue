<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('standard-units.id') }}</th>
          <td>{{ entry.id }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('standard-units.estimateIn') }}</th>
          <td>{{ entry.estimateIn.en }}</td>
        </tr>
        <tr>
          <th>{{ $t('standard-units.howMany') }}</th>
          <td>{{ entry.howMany.en }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { StandardUnitAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'StandardUnitDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<StandardUnitAttributes>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
