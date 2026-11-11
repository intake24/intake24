<template>
  <browse-layout>
    <data-table :headers="headers">
      <template #[`item.active`]="{ item }">
        <v-icon v-if="item.active" color="success" icon="$check" />
        <v-icon v-else color="error" icon="$times" />
      </template>
      <template #[`item.schedule`]="{ item }">
        {{ readableCron(item.cron) }}
      </template>
      <template #action-prepend="{ item }">
        <confirm-dialog
          v-if="canRun && !item.active"
          color="primary"
          icon
          icon-left="fas fa-play"
          :label="t('tasks.run._')"
          @confirm="triggerJob(item.id, item.name)"
        >
          {{ t('tasks.run.confirm') }}
        </confirm-dialog>
      </template>
    </data-table>
  </browse-layout>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import cronstrue from 'cronstrue';

import { DataTable } from '@intake24/admin/components/data-tables';
import { BrowseLayout } from '@intake24/admin/components/layouts';
import { useHttp } from '@intake24/admin/services';
import { useMessages, useUser } from '@intake24/admin/stores';
import { ConfirmDialog, useI18n } from '@intake24/ui';

defineOptions({ name: 'TaskList' });

const { i18n: { t } } = useI18n();
const http = useHttp();
const canRun = useUser().can('tasks:edit');

const headers: DataTableHeader[] = [
  {
    title: t('common.name'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('tasks.job'),
    sortable: true,
    key: 'job',
  },
  {
    title: t('tasks.schedule'),
    sortable: false,
    key: 'schedule',
  },
  {
    title: t('tasks.cron'),
    sortable: false,
    key: 'cron',
  },
  {
    title: t('common.action.active'),
    sortable: false,
    key: 'active',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];

function readableCron(cron: string) {
  return cronstrue.toString(cron, { use24HourTimeFormat: true });
}

async function triggerJob(id: string, name: string) {
  await http.post(`admin/tasks/${id}/run`);
  useMessages().success(t('tasks.run.confirmed', { name }));
}
</script>
