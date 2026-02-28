<template>
  <v-card class="mb-5 px-2" :flat="$vuetify.display.mobile">
    <v-toolbar color="white">
      <v-btn color="grey-darken-1" :title="$t(`common.action.back`)" :to="{ name: 'user.jobs' }">
        <v-icon icon="$back" start />{{ $t(`common.action.back`) }}
      </v-btn>
    </v-toolbar>
  </v-card>
  <v-card :border="!$vuetify.display.mobile" :flat="$vuetify.display.mobile" :tile="$vuetify.display.mobile">
    <v-tabs bg-color="primary">
      <v-tab :key="$t('user.jobs.create')" :title="$t('user.jobs.create')">
        {{ $t('user.jobs.create') }}
      </v-tab>
    </v-tabs>
    <jobs v-bind="{ defaultParams, types }" />
  </v-card>
</template>

<script lang="ts" setup>
import type { JobParams, UserJob } from '@intake24/common/types';

import { computed } from 'vue';

import { Jobs } from '@intake24/admin/components/jobs';
import { userJobs as types } from '@intake24/common/types';

defineOptions({ name: 'UserJobCreate' });

const defaultParams = computed<Pick<JobParams, UserJob>>(() => ({
  ResourceExport: { resource: 'as-served-sets' },
}));
</script>

<style lang="scss" scoped></style>
