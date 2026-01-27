<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-list-item key="respondentsUpload" link v-bind="props">
        <v-list-item-title>
          <v-icon icon="$upload" start />
          {{ $t('surveys.respondents.upload._') }}
        </v-list-item-title>
      </v-list-item>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-icon end icon="$upload" />
        <v-toolbar-title>
          {{ $t(`surveys.respondents.upload.title`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @submit.prevent="submit">
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm>
                <v-file-input
                  v-model="data.params.file"
                  :error-messages="errors.get('file')"
                  hide-details="auto"
                  :label="$t('common.file.csv')"
                  name="file"
                  prepend-icon=""
                  prepend-inner-icon="fas fa-file-csv"
                  variant="outlined"
                  @change="errors.clear('file')"
                />
              </v-col>
              <v-col cols="12" sm="auto">
                <v-btn block color="primary" :disabled="jobInProgress" size="x-large" type="submit">
                  <v-icon icon="$upload" start />
                  {{ $t('surveys.respondents.upload.submit') }}
                </v-btn>
              </v-col>
            </v-row>
            <polls-job-list v-bind="{ jobs }" />
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="font-weight-bold" color="info" variant="text" @click.stop="close">
            {{ $t('common.action.close') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { JobAttributes } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { PollsJobList, usePollsForJobs } from '@intake24/admin/components/jobs';
import { useForm } from '@intake24/admin/composables';

type RespondentsUploadForm = {
  type: 'SurveyRespondentsImport';
  params: {
    surveyId: string;
    file: File | null;
  };
};

export default defineComponent({
  name: 'RespondentsUpload',

  components: { PollsJobList },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const jobType = 'SurveyRespondentsImport';
    const jobQuery = computed(() => ({ surveyId: props.surveyId }));

    const { data, errors, post, reset } = useForm<RespondentsUploadForm>(
      {
        data: {
          type: jobType,
          params: { file: null, surveyId: props.surveyId },
        },
        config: { multipart: true },
      },
    );

    const { dialog, jobs, jobInProgress, startPolling } = usePollsForJobs(jobType, jobQuery);

    const close = () => {
      reset();
      dialog.value = false;
    };

    const submit = async () => {
      if (jobInProgress.value)
        return;

      const job = await post<JobAttributes>(`admin/surveys/${props.surveyId}/tasks`);

      jobs.value.unshift(job);
      await startPolling();
    };

    return {
      close,
      data,
      dialog,
      errors,
      jobs,
      jobInProgress,
      startPolling,
      submit,
    };
  },
});
</script>

<style lang="scss" scoped></style>
