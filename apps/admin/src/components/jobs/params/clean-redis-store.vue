<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="params.store"
      :error-messages="errors.get('params.store')"
      :items="stores"
      :label="$t('jobs.types.CleanRedisStore.stores._')"
      multiple
      name="store"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts" setup>
import { redisStoreTypes } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'CleanRedisStore'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'CleanRedisStore'>(props, { emit });

const { i18n: { t } } = useI18n();

const stores = redisStoreTypes.map(value => ({
  value,
  title: t(`jobs.types.CleanRedisStore.stores.${value}`),
}));
</script>

<style scoped></style>
