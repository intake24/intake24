<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="params.resource"
      :error-messages="errors.get('params.resource')"
      hide-details="auto"
      :items="items"
      :label="$t('jobs.types.ResourceExport.resource')"
      name="resource"
      prepend-inner-icon="fas fa-list"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts" setup>
import { useUser } from '@intake24/admin/stores';
import { resources } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'ResourceExport'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'ResourceExport'>(props, { emit });

const { i18n } = useI18n();
const { can } = useUser();

const items = resources.filter(item => can(`${item.split('.')[0]}:browse`)).map(value => ({
  title: i18n.t(`${value}.title`),
  value,
}));
</script>

<style scoped></style>
