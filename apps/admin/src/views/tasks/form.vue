<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <confirm-dialog
        v-if="!isCreate && can({ action: 'edit' })"
        color="primary"
        icon-left="fas fa-play"
        :label="$t('tasks.run._')"
        @confirm="triggerJob"
      >
        {{ $t('tasks.run.confirm') }}
      </confirm-dialog>
    </template>
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('common.name')"
                name="name"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.job"
                :error-messages="errors.get('job')"
                hide-details="auto"
                :items="jobs"
                :label="$t('tasks.job')"
                name="job"
                prepend-inner-icon="$jobs"
                variant="outlined"
                @update:model-value="jobChanged"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.cron"
                :error-messages="errors.get('cron')"
                hide-details="auto"
                :label="$t('tasks.cron')"
                name="cron"
                prepend-inner-icon="far fa-clock"
                variant="outlined"
              >
                <template #append>
                  <pre>{{ readableCron }}</pre>
                </template>
              </v-text-field>
            </v-col>
            <v-col v-if="data.active" cols="12" md="6">
              <div class="d-flex align-center" style="height: 100%">
                <span v-if="entry.bullJob?.next" class="text-subtitle-1">
                  {{ $t('tasks.run.next') }}: {{ formatDateTime(new Date(entry.bullJob.next)) }}
                </span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="data.active"
                :error-messages="errors.get('active')"
                hide-details="auto"
                :label="$t('common.action.active')"
                name="active"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="data.description"
                :error-messages="errors.get('description')"
                hide-details="auto"
                :label="$t('common.description')"
                name="description"
                prepend-inner-icon="$description"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <component
            :is="data.job"
            v-if="Object.keys(data.params).length"
            v-model="data.params"
            :errors="errors"
            name="params"
            @update:model-value="errors.clear(paramErrors)"
          />
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import cronstrue from 'cronstrue';
import { computed, defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { jobParams } from '@intake24/admin/components/jobs';
import { useDateTime, useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import type { JobType, JobTypeParams } from '@intake24/common/types';
import { defaultJobsParams, jobTypes } from '@intake24/common/types';
import type { TaskResponse } from '@intake24/common/types/http/admin';
import { ConfirmDialog, useI18n } from '@intake24/ui';

type TaskForm = {
  id: string | null;
  name: string | null;
  job: JobType;
  cron: string | null;
  active: boolean;
  description: string | null;
  params: JobTypeParams;
};

export default defineComponent({
  name: 'TaskForm',

  components: { ConfirmDialog, ...jobParams },

  mixins: [formMixin],

  setup(props) {
    const { i18n } = useI18n();

    const loadCallback = (data: TaskResponse) => {
      const { params, ...rest } = data;
      return { ...rest, params: { ...defaultJobsParams[rest.job], ...params } };
    };

    const { formatDateTime } = useDateTime();

    const { entry, entryLoaded, isCreate, isEdit } = useEntry<TaskResponse>(props);
    useEntryFetch(props);

    const jobs = computed(() =>
      jobTypes.map(value => ({ value, title: i18n.t(`jobs.types.${value}._`) })),
    );

    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<TaskForm, TaskResponse>(props, {
      data: {
        id: null,
        name: null,
        job: 'CleanRedisStore',
        cron: null,
        active: false,
        description: null,
        params: {},
      },
      loadCallback,
    });

    const paramErrors = computed(() => Object.keys(data.value.params).map(key => `params.${key}`));

    return {
      defaultJobsParams,
      entry,
      entryLoaded,
      formatDateTime,
      isCreate,
      isEdit,
      jobs,
      paramErrors,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },

  computed: {
    readableCron(): string {
      if (!this.data.cron)
        return '';

      try {
        return cronstrue.toString(this.data.cron, { use24HourTimeFormat: true });
      }
      catch {
        return this.$t('tasks.invalidCron');
      }
    },
  },

  methods: {
    jobChanged() {
      this.errors.clear('job');
      this.updateParams();
    },

    updateParams() {
      if (!this.data.job) {
        this.data.params = {};
        return;
      }

      this.data.params = { ...this.defaultJobsParams[this.data.job] };
    },

    async triggerJob() {
      await this.$http.post(`admin/tasks/${this.id}/run`);
    },
  },
});
</script>

<style scoped></style>
