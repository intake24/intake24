<template>
  <data-table :headers="headers" />
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';

import { DataTable } from '@intake24/admin/components/data-tables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'NutrientUnitList' });

const { i18n: { t } } = useI18n();

const headers: DataTableHeader[] = [
  {
    title: t('nutrient-units.id'),
    sortable: true,
    key: 'id',
  },
  {
    title: t('common.description'),
    sortable: true,
    key: 'description',
  },
  {
    title: t('nutrient-units.symbol'),
    sortable: true,
    key: 'symbol',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];
</script>
