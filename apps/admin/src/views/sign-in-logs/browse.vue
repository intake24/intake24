<template>
  <browse-layout>
    <data-table :actions="['read', 'delete']" :headers>
      <template #[`item.successful`]="{ item }">
        <v-icon v-if="item.successful" color="success" icon="$check" />
        <v-icon v-else color="error" icon="$times" />
      </template>
      <template #[`item.date`]="{ item }">
        {{ formatDateTime(item.date) }}
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

defineOptions({ name: 'SignInLogList' });

const { i18n: { t } } = useI18n();
const { formatDateTime } = useDateTime();

const headers: DataTableHeader[] = [
  {
    title: t('common.id'),
    sortable: true,
    key: 'id',
  },
  {
    title: t('users.id'),
    sortable: true,
    key: 'userId',
  },
  {
    title: t('sign-in-logs.provider'),
    sortable: true,
    key: 'provider',
  },
  {
    title: t('sign-in-logs.providerKey'),
    sortable: true,
    key: 'providerKey',
  },
  {
    title: t('sign-in-logs.successful'),
    sortable: false,
    key: 'successful',
  },
  {
    title: t('sign-in-logs.date'),
    sortable: true,
    key: 'date',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
