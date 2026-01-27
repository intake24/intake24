<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('nutrient-types.id') }}</th>
          <td>{{ entry.id }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.description') }}</th>
          <td>{{ entry.description }}</td>
        </tr>
        <tr>
          <th>{{ $t('nutrient-units._') }}</th>
          <td>{{ entry.unit?.description || $t('common.none') }}</td>
        </tr>
        <tr>
          <th>{{ $t('nutrient-types.kcalPerUnit') }}</th>
          <td>{{ entry.kcalPerUnit || $t('common.none') }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { NutrientTypeResponse } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'NutrientTypeDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded, refs, refsLoaded } = useEntry<NutrientTypeResponse>(props);

    return { entry, entryLoaded, refs, refsLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
