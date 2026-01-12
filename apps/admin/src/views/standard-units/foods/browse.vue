<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table
      ref="table"
      :api-url="`admin/standard-units/${id}/foods`"
      :headers="headers"
    >
      <template #[`item.action`]="{ item }">
        <read
          action="read"
          :item="item"
          :to="{ name: 'fdbs-foods', params: { id: item.localeId, entryId: item.id } }"
        />
      </template>
    </embedded-data-table>
  </layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { EmbeddedDataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { Read } from '@intake24/admin/components/data-tables/action-bar';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { StandardUnitAttributes } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'StandardUnitFoods',

  components: { EmbeddedDataTable, Read },

  mixins: [detailMixin],

  setup(props) {
    const { i18n: { t } } = useI18n();
    const { entry, entryLoaded } = useEntry<StandardUnitAttributes>(props);
    useEntryFetch(props);

    const table = ref<InstanceType<typeof EmbeddedDataTable>>();

    const headers: DataTableHeader[] = [
      {
        title: t('fdbs.foods.code'),
        sortable: true,
        key: 'code',
      },
      {
        title: t('locales.code'),
        sortable: true,
        key: 'localeCode',
      },
      {
        title: t('fdbs.foods.id'),
        sortable: true,
        key: 'id',
      },
      {
        title: t('fdbs.foods.name'),
        sortable: true,
        key: 'name',
      },
      {
        title: t('common.action._'),
        sortable: false,
        key: 'action',
        align: 'end',
      },
    ];

    const updateTable = async () => {
      await table.value?.fetch();
    };

    return { entry, entryLoaded, headers, table, updateTable };
  },
});
</script>

<style lang="scss" scoped></style>
