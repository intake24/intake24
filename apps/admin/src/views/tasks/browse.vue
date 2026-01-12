<template>
  <data-table :headers="headers">
    <template #[`item.active`]="{ item }">
      <v-icon v-if="item.active" color="success">
        $check
      </v-icon>
      <v-icon v-else color="error">
        $times
      </v-icon>
    </template>
    <template #[`item.schedule`]="{ item }">
      {{ readableCron(item.cron) }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import cronstrue from 'cronstrue';

import { DataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'TaskList' });

const { i18n: { t } } = useI18n();

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
</script>
