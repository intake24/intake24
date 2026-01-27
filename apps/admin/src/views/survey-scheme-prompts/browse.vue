<template>
  <data-table :headers="headers">
    <template #[`item.type`]="{ item }">
      {{ $t(`survey-schemes.prompts.${item.prompt.type}._`) }}
    </template>
    <template #[`item.component`]="{ item }">
      {{ $t(`survey-schemes.prompts.${item.prompt.component}.title`) }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import { DataTable } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'SchemePromptList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('survey-schemes.prompts.internal.id._'),
    sortable: true,
    key: 'promptId',
  },
  {
    title: t('survey-schemes.prompts.internal.name._'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('survey-schemes.prompts.type'),
    sortable: false,
    key: 'type',
  },
  {
    title: t('survey-schemes.prompts.component'),
    sortable: false,
    key: 'component',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
