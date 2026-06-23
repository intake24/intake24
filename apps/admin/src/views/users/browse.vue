<template>
  <browse-layout>
    <data-table :headers />
  </browse-layout>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import { DataTable } from '@intake24/admin/components/data-tables';
import { BrowseLayout } from '@intake24/admin/components/layouts';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'UserList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('users.name'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('common.email'),
    sortable: true,
    key: 'email',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
