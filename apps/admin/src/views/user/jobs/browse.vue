<template>
  <browse-layout>
    <data-table :actions="['create', 'download', 'read']" api-url="admin/user/jobs" :headers>
      <template #[`item.successful`]="{ item }">
        <v-icon v-if="item.successful" color="success" icon="$check" />
        <v-icon v-else color="error" icon="$times" />
      </template>
      <template #[`item.startedAt`]="{ item }">
        {{ formatDateTime(item.startedAt) }}
      </template>
    </data-table>
  </browse-layout>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import { DataTable } from '@intake24/admin/components/data-tables';
import { BrowseLayout } from '@intake24/admin/components/layouts';
import { useDateTime } from '@intake24/admin/composables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'UserJobList' });

const { i18n: { t } } = useI18n();
const { formatDateTime } = useDateTime();

const headers: DataTableHeader[] = [
  {
    title: t('common.id'),
    sortable: true,
    key: 'id',
  },
  {
    title: t('common.type'),
    sortable: true,
    key: 'type',
  },
  {
    title: t('common.startedAt'),
    sortable: true,
    key: 'startedAt',
  },
  {
    title: t('common.status'),
    sortable: false,
    key: 'successful',
    align: 'center',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
