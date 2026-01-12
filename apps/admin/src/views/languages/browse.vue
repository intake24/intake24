<template>
  <data-table :headers="headers">
    <template #[`item.code`]="{ item }">
      <span :class="`fi fi-${item.countryFlagCode} mr-3`" />
      {{ item.code }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import { DataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'LanguageList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('languages.code'),
    sortable: true,
    key: 'code',
  },
  {
    title: t('languages.englishName'),
    sortable: true,
    key: 'englishName',
  },
  {
    title: t('languages.localName'),
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
