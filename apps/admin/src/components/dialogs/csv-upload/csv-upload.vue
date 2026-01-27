<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn size="large" v-bind="props">
        <v-list-item-title>
          <v-icon icon="$upload" start />
          {{ label }}
        </v-list-item-title>
      </v-btn>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-icon end icon="$upload" />
        <v-toolbar-title>
          {{ dialogTitle }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @submit.prevent="submit">
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm>
                <v-file-input
                  v-model="data.file"
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
                  {{ $t('common.action.upload') }}
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
import type { PropType } from 'vue';

import type { JobType } from '@intake24/common/types';
import type { JobAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { PollsJobList, usePollsForJobs } from '@intake24/admin/components/jobs';
import { useForm } from '@intake24/admin/composables';

type CsvUploadForm = {
  file: File | null;
};

export default defineComponent({
  name: 'CsvUpload',

  components: { PollsJobList },

  props: {
    label: {
      type: String,
      required: true,
    },
    dialogTitle: {
      type: String,
      required: true,
    },
    jobType: {
      type: String as PropType<JobType>,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const form = useForm<CsvUploadForm>({ data: { file: null }, config: { multipart: true } });
    const { data, errors } = form;
    const { dialog, jobs, jobInProgress, startPolling } = usePollsForJobs(props.jobType);

    return { data, errors, form, dialog, jobs, jobInProgress, startPolling };
  },

  methods: {
    close() {
      this.form.reset();
      this.dialog = false;
    },

    async submit() {
      if (this.jobInProgress)
        return;

      const job = await this.form.post<JobAttributes>(this.endpoint);

      this.jobs.unshift(job);
      await this.startPolling();
    },
  },
});
</script>

<style lang="scss" scoped></style>
