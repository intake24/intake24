<template>
  <layout v-bind="{ id, entry }">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-row>
          <v-col cols="12" md="6">
            <v-card-title>{{ $t('nutrient-tables.tasks.title') }}</v-card-title>
            <v-card-text>
              <v-select
                v-model="data.type"
                hide-details="auto"
                :items="jobTypeList"
                :label="$t('nutrient-tables.tasks._')"
                name="job"
                prepend-inner-icon="$jobs"
                variant="outlined"
                @update:model-value="updateJob"
              />
            </v-card-text>
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
        <v-row>
          <v-col class="px-6" cols="12" md="6">
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
        <polls-job-list v-bind="{ jobs }" />
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { GetJobParams, JobParams, NutrientTableJob } from '@intake24/common/types';
import type {
  JobAttributes,
  NutrientTableEntry,
  NutrientTableRefs,
} from '@intake24/common/types/http/admin';

import { computed, defineComponent, onMounted } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { jobParams, PollsJobList, usePollsForJobs } from '@intake24/admin/components/jobs';
import { useEntry, useEntryFetch, useForm } from '@intake24/admin/composables';
import { nutrientTableJobs } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

type NutrientTableTasksForm = {
  type: NutrientTableJob;
  params: GetJobParams<NutrientTableJob>;
};

export default defineComponent({
  name: 'NutrientTableTasks',

  components: { ...jobParams, PollsJobList },

  mixins: [formMixin],

  setup(props) {
    const { i18n } = useI18n();

    const jobTypeList = computed(() =>
      nutrientTableJobs.map(value => ({ value, title: i18n.t(`jobs.types.${value}._`) })),
    );
    const jobQuery = computed(() => ({ nutrientTableId: props.id }));

    const defaultJobsParams = computed<Pick<JobParams, NutrientTableJob>>(() => ({
      NutrientTableMappingImport: { nutrientTableId: props.id, file: '' },
      NutrientTableDataImport: { nutrientTableId: props.id, file: '' },
    }));

    const disabledJobParams = {
      NutrientTableMappingImport: { nutrientTableId: true },
      NutrientTableDataImport: { nutrientTableId: true },
    };

    const { entry, entryLoaded, refs, refsLoaded } = useEntry<
      NutrientTableEntry,
      NutrientTableRefs
    >(props);
    useEntryFetch(props);
    const { clearError, data, errors, post } = useForm<NutrientTableTasksForm>({
      data: { type: nutrientTableJobs[0], params: defaultJobsParams.value[nutrientTableJobs[0]] },
      config: { multipart: true, resetOnSubmit: false },
    });
    const { jobs, jobInProgress, startPolling } = usePollsForJobs(nutrientTableJobs, jobQuery);

    const paramErrors = computed(() => Object.keys(data.value.params).map(key => `params.${key}`));

    onMounted(async () => {
      await startPolling(true);
    });

    const updateJob = () => {
      errors.clear();
      data.value.params = defaultJobsParams.value[data.value.type];
    };

    const submit = async () => {
      if (jobInProgress.value)
        return;

      const job = await post<JobAttributes>(`admin/nutrient-tables/${props.id}/tasks`);

      jobs.value.unshift(job);
      await startPolling();
    };

    return {
      defaultJobsParams,
      disabledJobParams,
      jobTypeList,
      entry,
      entryLoaded,
      refs,
      refsLoaded,
      clearError,
      paramErrors,
      data,
      errors,
      jobs,
      jobInProgress,
      startPolling,
      submit,
      updateJob,
    };
  },
});
</script>

<style lang="scss" scoped></style>
