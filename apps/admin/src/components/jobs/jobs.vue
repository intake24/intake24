<template>
  <v-toolbar color="grey-lighten-4">
    <v-icon color="secondary" end icon="$jobs" />
    <v-toolbar-title class="font-weight-medium">
      {{ $t('tasks.title') }}
    </v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <v-container fluid>
    <v-form @keydown="clearError" @submit.prevent="submit">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="data.type"
              hide-details="auto"
              :items="jobTypes"
              :label="$t('tasks._')"
              name="job"
              prepend-inner-icon="$jobs"
              variant="outlined"
              @update:model-value="updateJob"
            />
          </v-col>
          <v-col cols="12" md="6">
            <component
              :is="data.type"
              v-if="Object.keys(data.params).length"
              v-model="data.params"
              :disabled="disabledJobParams[data.type]"
              :errors="errors"
              name="params"
              :refs="refs"
              @update:model-value="errors.clear(paramErrors)"
            />
          </v-col>
        </v-row>
        <v-row v-if="alert">
          <v-col cols="12">
            <v-alert
              icon="fas fa-triangle-exclamation"
              prominent
              :type="alert.type"
              variant="tonal"
            >
              <div class="d-flex flex-column ga-4">
                <div class="text-h5 font-weight-medium text-uppercase">
                  {{ $t(`jobs.alerts.${alert.type}.title`) }}
                </div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ $t(`jobs.alerts.${alert.type}.subtitle`) }}
                </div>
                <p v-for="p in alert.lines" :key="p">
                  {{ $t(`jobs.types.${data.type}.alert.${p}`) }}
                </p>
              </div>
            </v-alert>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              block
              color="primary"
              :disabled="errors.any.value || jobInProgress || isAppLoading"
              size="x-large"
              :title="$t('common.action.upload')"
              type="submit"
            >
              <v-icon icon="fas fa-play" start />{{ $t('common.action.submit') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <polls-job-list v-bind="{ jobs }" />
    </v-form>
  </v-container>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { JobParams, JobType } from '@intake24/common/types';
import type { JobAttributes } from '@intake24/common/types/http/admin';

import { computed, onMounted } from 'vue';

import { useForm } from '@intake24/admin/composables';
import { resourceToRequestParam } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

import jobParams from './params';
import PollsJobList from './polls-job-list.vue';
import { usePollsForJobs } from './use-polls-for-jobs';

type TaskForm = {
  type: JobType;
  params: JobParams;
};

defineOptions({ components: { ...jobParams } });

const props = defineProps({
  id: {
    type: String,
  },
  alerts: {
    type: Object as PropType<Partial<Record<JobType, { type: 'error' | 'info' | 'success' | 'warning'; lines: number }>>>,
    default: () => ({}),
  },
  defaultParams: {
    type: Object as PropType<Partial<JobParams>>,
    required: true,
  },
  refs: {
    type: Object,
    default: () => ({}),
  },
  resource: {
    type: String,
  },
  types: {
    type: Array as PropType<readonly JobType[]>,
    required: true,
  },
});

const { i18n } = useI18n();

const jobTypes = computed(() =>
  props.types.map(value => ({ value, title: i18n.t(`jobs.types.${value}._`) })),
);

const resourceParameter = computed(() => props.resource ? resourceToRequestParam(props.resource) : undefined);
const disabledJobParams = computed(() => Object.keys(props.defaultParams).reduce((acc, jobType) => {
  acc[jobType as JobType] = resourceParameter.value ? { [resourceParameter.value]: true } : {};
  return acc;
}, {} as Partial<Record<JobType, Record<string, boolean>>>));
const url = computed(() => props.resource && props.id ? `admin/${props.resource}/${props.id}/tasks` : `admin/user/jobs`);
const query = computed(() => resourceParameter.value && props.id ? { [resourceParameter.value]: props.id } : {});

const { clearError, data, errors, post } = useForm<TaskForm>({
  data: { type: props.types[0], params: props.defaultParams[props.types[0]] as JobParams },
  config: { multipart: true, resetOnSubmit: false },
});
const { jobs, jobInProgress, startPolling } = usePollsForJobs(props.types, query);

const alert = computed(() => props.alerts[data.value.type]);
const paramErrors = computed(() => Object.keys(data.value.params).map(key => `params.${key}`));

onMounted(async () => {
  await startPolling(true);
});

function updateJob(type: JobType) {
  errors.clear();
  data.value.params = props.defaultParams[type] as JobParams;
}

async function submit() {
  if (jobInProgress.value)
    return;

  const job = await post<JobAttributes>(url.value);

  jobs.value.unshift(job);
  await startPolling();
}
</script>

<style lang="scss" scoped></style>
