<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="params.subTasks"
      :error-messages="errors.get('params.subTasks')"
      hide-details="auto"
      :items="subTasks"
      :label="$t('jobs.types.LocalesSync.subTasks._')"
      multiple
      name="subTasks"
      prepend-inner-icon="fas fa-list"
      variant="outlined"
    >
      <template #selection="{ item, index }">
        <template v-if="index === 0">
          <span v-if="params.subTasks.length === 1">{{ item.raw.title }}</span>
          <span v-if="params.subTasks.length > 1">
            {{ $t('common.selected', { count: params.subTasks.length }) }}
          </span>
        </template>
      </template>
    </v-select>
  </div>
</template>

<script lang="ts" setup>
import { localesSyncSubTasks } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocalesSync'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocalesSync'>(props, { emit });

const { i18n } = useI18n();
const subTasks = localesSyncSubTasks.map(value => ({
  title: i18n.t(`jobs.types.LocalesSync.subTasks.${value}`),
  value,
}));
</script>

<style scoped></style>
