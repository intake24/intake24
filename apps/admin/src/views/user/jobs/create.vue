<template>
  <entry-layout v-bind="{ id }">
    <jobs v-bind="{ defaultParams, types }" />
  </entry-layout>
</template>

<script lang="ts" setup>
import type { JobParams, UserJob } from '@intake24/common/types';

import { computed } from 'vue';

import { Jobs } from '@intake24/admin/components/jobs';
import { EntryLayout } from '@intake24/admin/components/layouts';
import { userJobs as types } from '@intake24/common/types';

defineOptions({ name: 'UserJobCreate' });

defineProps({
  id: {
    type: String,
    default: 'create',
  },
});

const defaultParams = computed<Pick<JobParams, UserJob>>(() => ({
  ResourceExport: { resource: 'as-served-sets' },
}));
</script>

<style lang="scss" scoped></style>
