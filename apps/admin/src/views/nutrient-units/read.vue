<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('nutrient-units.id') }}</th>
          <td>{{ entry.id }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.description') }}</th>
          <td>{{ entry.description }}</td>
        </tr>
        <tr>
          <th>{{ $t('nutrient-units.symbol') }}</th>
          <td>{{ entry.symbol }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { NutrientUnitAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'NutrientUnitDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<NutrientUnitAttributes>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
