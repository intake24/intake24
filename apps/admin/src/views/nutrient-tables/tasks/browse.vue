<template>
  <layout v-bind="{ id, entry }">
    <jobs
      v-bind="{
        id,
        resource: 'nutrient-tables',
        alerts,
        defaultParams,
        refs,
        types,
      }"
    />
  </layout>
</template>

<script lang="ts">
import type { JobParams, NutrientTableJob } from '@intake24/common/types';
import type { NutrientTableEntry, NutrientTableRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { Jobs } from '@intake24/admin/components/jobs';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { nutrientTableJobs as types } from '@intake24/common/types';

export default defineComponent({
  name: 'NutrientTableTasks',

  components: { Jobs },

  mixins: [detailMixin],

  setup(props) {
    const { entry, refs } = useEntry<NutrientTableEntry, NutrientTableRefs>(props);
    useEntryFetch(props);

    const defaultParams = computed<Pick<JobParams, NutrientTableJob>>(() => ({
      NutrientTableMappingImport: { nutrientTableId: props.id, file: '' },
      NutrientTableDataImport: { nutrientTableId: props.id, file: '' },
    }));

    const alerts = {
      NutrientTableMappingImport: { type: 'warning' as const, lines: 1 },
      NutrientTableDataImport: { type: 'warning' as const, lines: 1 },
    };

    return {
      alerts,
      defaultParams,
      entry,
      refs,
      types,
    };
  },
});
</script>

<style lang="scss" scoped></style>
