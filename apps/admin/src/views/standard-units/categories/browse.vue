<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table
      ref="table"
      :api-url="`admin/standard-units/${id}/categories`"
      :headers="headers"
    >
      <template #[`item.action`]="{ item }">
        <read
          action="read"
          :item="item"
          :to="{ name: 'fdbs-categories', params: { id: item.localeId, entryId: item.id } }"
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
  name: 'StandardUnitCategories',

  components: { EmbeddedDataTable, Read },

  mixins: [detailMixin],

  setup(props) {
    const { i18n: { t } } = useI18n();

    const { entry, entryLoaded } = useEntry<StandardUnitAttributes>(props);
    useEntryFetch(props);

    const headers: DataTableHeader[] = [
      {
        title: t('fdbs.categories.code'),
        sortable: true,
        key: 'code',
      },
      {
        title: t('locales.code'),
        sortable: true,
        key: 'localeCode',
      },
      {
        title: t('fdbs.categories.id'),
        sortable: true,
        key: 'id',
      },
      {
        title: t('fdbs.categories.name'),
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

    const table = ref<InstanceType<typeof EmbeddedDataTable>>();

    const updateTable = async () => {
      await table.value?.fetch();
    };

    return { headers, entry, entryLoaded, table, updateTable };
  },

});
</script>

<style lang="scss" scoped></style>
