<template>
  <v-select
    v-model="nutrientTableId"
    class="mb-3"
    clearable
    hide-details="auto"
    item-title="description"
    item-value="id"
    :items="nutrientTables"
    :label="$t('nutrient-tables._')"
    name="nutrientTableId"
    prepend-inner-icon="$nutrient-tables"
    variant="outlined"
    @update:model-value="fetchNutrientTypes"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { ExportField } from '@intake24/common/surveys';
import type { Pagination } from '@intake24/common/types/http';
import type { FoodDatabaseRefs, NutrientTableAttributes } from '@intake24/common/types/http/admin';

import { defineComponent, onMounted, ref } from 'vue';

import { useHttp } from '@intake24/admin/services';

export default defineComponent({
  name: 'DataExportNutrients',

  props: {
    modelValue: {
      type: Array as PropType<ExportField[]>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const http = useHttp();

    const nutrientTableId = ref<string | undefined>();
    const nutrientTables = ref<FoodDatabaseRefs['nutrientTables']>([]);

    const fetchNutrientTables = async () => {
      const {
        data: { data },
      } = await http.get<Pagination<NutrientTableAttributes>>('admin/references/nutrient-tables', {
        params: { limit: 1000 },
      });

      nutrientTables.value = data;
    };

    const fetchNutrientTypes = async () => {
      const {
        data: { data },
      } = await http.get<Pagination<NutrientTableAttributes>>('admin/references/nutrient-types', {
        params: { limit: 1000, nutrientTableId: nutrientTableId.value },
      });

      const types = data.map(({ id, description }) => ({ id, label: description }));
      emit('update:modelValue', types);
    };

    onMounted(async () => {
      await fetchNutrientTables();
      await fetchNutrientTypes();
    });

    return {
      nutrientTableId,
      nutrientTables,
      fetchNutrientTypes,
    };
  },
});
</script>
