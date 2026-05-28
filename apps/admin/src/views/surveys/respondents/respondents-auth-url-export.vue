<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-list-item key="authUrls" link v-bind="props">
        <v-list-item-title>
          <v-icon icon="$download" start />
          {{ $t('surveys.respondents.authUrls._') }}
        </v-list-item-title>
      </v-list-item>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-icon end icon="$download" />
        <v-toolbar-title>
          {{ $t(`surveys.respondents.authUrls.title`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container>
          <v-row class="justify-center">
            <v-col cols="12" md="6" sm="8">
              <v-btn block color="primary" :disabled="jobInProgress" size="x-large" @click="submit">
                <v-icon icon="$download" start />
                {{ $t('surveys.respondents.authUrls.submit') }}
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
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

import { PollsJobList, usePollsForJobs } from '@intake24/admin/components/jobs';
import { useHttp } from '@intake24/admin/services';

export default defineComponent({
  name: 'RespondentsAuthUrlExport',

  components: { PollsJobList },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const http = useHttp();
    const jobType = 'SurveyAuthUrlsExport';
    const jobQuery = computed(() => ({ surveyId: props.surveyId }));

    const { dialog, jobs, jobInProgress, startPolling } = usePollsForJobs(jobType, jobQuery);

    const close = () => {
      dialog.value = false;
    };

    const submit = async () => {
      if (jobInProgress.value)
        return;

      const { data } = await http.post(
        `admin/surveys/${props.surveyId}/tasks`,
        { type: jobType, params: { surveyId: props.surveyId } },
      );

      jobs.value.unshift(data);
      await startPolling();
    };

    return { close, dialog, jobs, jobInProgress, startPolling, submit };
  },
});
</script>

<style lang="scss" scoped></style>
