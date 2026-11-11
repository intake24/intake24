<template>
  <browse-layout>
    <data-table :actions="['read', 'delete']" :headers>
      <template #[`item.userId`]="{ item }">
        {{ item.user?.email ?? item.userId }}
      </template>
      <template #[`item.successful`]="{ item }">
        <job-status-icon :progress="item.progress" :successful="item.successful" />
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
import { JobStatusIcon } from '@intake24/admin/components/jobs';
import { BrowseLayout } from '@intake24/admin/components/layouts';
import { useDateTime } from '@intake24/admin/composables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'JobList' });

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
    title: t('users._'),
    sortable: true,
    key: 'userId',
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
