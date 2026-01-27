<template>
  <data-table :headers="headers">
    <template #[`item.createdAt`]="{ item }">
      {{ formatDateTime(item.createdAt) }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import { DataTable } from '@intake24/admin/components/data-tables';
import { useDateTime } from '@intake24/admin/composables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'PermissionList' });

const { i18n: { t } } = useI18n();
const { formatDateTime } = useDateTime();

const headers: DataTableHeader[] = [
  {
    title: t('common.name'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('common.displayName'),
    sortable: true,
    key: 'displayName',
  },
  {
    title: t('common.createdAt'),
    sortable: true,
    key: 'createdAt',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
