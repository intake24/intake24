<template>
  <data-table :actions="['read']" api-url="admin/fdbs" :headers="headers">
    <template #[`item.code`]="{ item }">
      <span :class="`fi fi-${item.countryFlagCode} mr-3`" />
      {{ item.code }}
    </template>
    <template #[`item.action`]="{ item }">
      <v-btn color="secondary" icon :to="{ name: 'fdbs-food-list', params: { id: item.id } }" variant="text">
        <v-icon>far fa-file</v-icon>
      </v-btn>
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import { DataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'FoodDbList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('locales.code'),
    sortable: true,
    key: 'code',
  },
  {
    title: t('locales.englishName'),
    sortable: true,
    key: 'englishName',
  },
  {
    title: t('locales.localName'),
    sortable: true,
    key: 'localName',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
