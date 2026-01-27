<template>
  <v-list class="list-border" lines="two">
    <v-list-item v-for="job in jobs" :key="job.id">
      <template #prepend>
        <v-avatar color="grey" icon="$jobs" />
      </template>
      <v-list-item-title>{{ $t(`jobs.types.${job.type}._`) }}</v-list-item-title>
      <v-list-item-subtitle v-if="job.message">
        {{ job.message }}
      </v-list-item-subtitle>
      <template #append>
        <v-list-item-action class="d-flex flex-column">
          <v-chip size="small">
            {{ $t('common.startedAt') }}:
            {{ job.startedAt ? new Date(job.startedAt).toLocaleString() : $t('common.na') }}
          </v-chip>
          <v-chip v-if="job.completedAt" class="mt-1" size="small">
            {{ $t('common.completedAt') }}:
            {{ job.completedAt ? new Date(job.completedAt).toLocaleString() : $t('common.na') }}
          </v-chip>
        </v-list-item-action>
        <v-list-item-action>
          <v-btn
            :disabled="!downloadUrlAvailable(job)"
            icon
            size="large"
            :title="$t('common.action.download')"
            @click="download(job)"
          >
            <v-icon color="secondary">
              $download
            </v-icon>
          </v-btn>
        </v-list-item-action>
        <v-list-item-action>
          <v-progress-circular
            v-if="(job.progress || 0) !== 1"
            color="info"
            :model-value="Math.ceil((job.progress || 0) * 100)"
            :rotate="-90"
            :size="45"
            :width="6"
          >
            <span class="font-weight-bold text--primary">
              {{ Math.ceil((job.progress || 0) * 100) }}
            </span>
          </v-progress-circular>
          <template v-else>
            <v-icon v-if="job.successful" color="success" size="large">
              $check
            </v-icon>
            <v-icon v-if="!job.successful" color="error" size="large">
              $times
            </v-icon>
          </template>
        </v-list-item-action>
      </template>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { JobAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { useDownloadJob } from './use-download-job';

export default defineComponent({
  name: 'PollsJobList',

  props: {
    jobs: {
      type: Array as PropType<JobAttributes[]>,
      default: () => [],
    },
  },

  setup() {
    const { download, downloadUrlAvailable } = useDownloadJob(true);

    return { download, downloadUrlAvailable };
  },
});
</script>

<style lang="scss" scoped></style>
