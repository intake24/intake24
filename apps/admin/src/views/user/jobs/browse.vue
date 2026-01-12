<template>
  <h2 class="mb-4">
    {{ $t('user.profile') }}
  </h2>
  <data-table :actions="['create', 'download', 'read']" api-url="admin/user/jobs" :headers="headers">
    <template #[`item.successful`]="{ item }">
      <v-icon v-if="item.successful" color="success">
        $check
      </v-icon>
      <v-icon v-else color="error">
        $times
      </v-icon>
    </template>
    <template #[`item.startedAt`]="{ item }">
      {{ formatDateTime(item.startedAt) }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import { DataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
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
