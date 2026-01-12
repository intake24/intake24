<template>
  <data-table :headers="headers">
    <template #[`item.locale`]="{ item }">
      {{ item.locale.code }}
    </template>
    <template #[`item.surveyScheme`]="{ item }">
      {{ item.surveyScheme.name }}
    </template>
  </data-table>
</template>

<script lang="ts" setup>
import { DataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'SurveyList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('surveys.id'),
    sortable: true,
    key: 'slug',
  },
  {
    title: t('common.name'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('locales._'),
    sortable: true,
    key: 'locale',
  },
  {
    title: t('survey-schemes._'),
    sortable: true,
    key: 'surveyScheme',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
