<template>
  <v-col cols="12" sm="auto">
    <v-card height="100%">
      <v-toolbar color="grey-lighten-4">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium text-uppercase">
          {{ $t('feedback.outputs.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="d-flex flex-column">
        <v-btn
          v-if="outputs.includes('print')"
          class="mb-3"
          color="secondary"
          rounded
          :title="$t('feedback.outputs.print')"
          variant="outlined"
          @click="printFeedback"
        >
          <v-icon icon="fas fa-print" start />
          {{ $t('feedback.outputs.print') }}
        </v-btn>
        <v-dialog
          v-if="outputs.includes('email')"
          v-model="email.dialog"
          :fullscreen="$vuetify.display.smAndDown"
          max-width="500px"
        >
          <template #activator="{ props }">
            <v-btn
              class="mb-3"
              color="secondary"
              rounded
              :title="$t('feedback.outputs.email._')"
              variant="outlined"
              v-bind="props"
            >
              <v-icon icon="fas fa-envelope" start />
              {{ $t('feedback.outputs.email._') }}
            </v-btn>
          </template>
          <v-card :tile="$vuetify.display.smAndDown">
            <v-toolbar color="secondary">
              <v-btn
                icon="$close"
                :title="$t('common.action.close')"
                @click.stop="email.dialog = false"
              />
              <v-toolbar-title>{{ $t('feedback.outputs.email.title') }}</v-toolbar-title>
            </v-toolbar>

            <v-form autocomplete="off" @submit.prevent="emailFeedback">
              <v-card-text class="pa-6 d-flex flex-column ga-6">
                <v-text-field
                  v-model="email.form.email"
                  :error-messages="email.errors.get('email')"
                  hide-details="auto"
                  :label="$t('common.email')"
                  name="email"
                  prepend-inner-icon="fas fa-envelope"
                  @update:model-value="email.errors.clear('email')"
                />
                <v-text-field
                  v-model="email.form.emailConfirm"
                  :error-messages="email.errors.get('emailConfirm')"
                  hide-details="auto"
                  :label="$t('common.emailConfirm')"
                  name="emailConfirm"
                  prepend-inner-icon="fas fa-envelope"
                  @update:model-value="email.errors.clear('emailConfirm')"
                />
                <v-alert v-if="message" type="success" variant="outlined">
                  {{ message }}
                </v-alert>
                <v-alert v-if="retry.retryIn" type="warning" variant="outlined">
                  {{ retryMessage }}
                </v-alert>
                <v-btn
                  color="secondary"
                  :disabled="!!retry.retryIn || email.errors.any()"
                  size="x-large"
                  type="submit"
                >
                  <v-icon icon="fas fa-paper-plane" start />
                  {{ $t('feedback.outputs.email.send') }}
                </v-btn>
              </v-card-text>
            </v-form>
          </v-card>
        </v-dialog>
        <v-dialog
          v-if="outputs.includes('download')"
          v-model="download.dialog"
          :fullscreen="$vuetify.display.smAndDown"
          max-width="500px"
        >
          <template #activator="{ props }">
            <v-btn
              class="mb-3"
              color="secondary"
              rounded
              :title="$t('feedback.outputs.download._')"
              variant="outlined"
              v-bind="props"
            >
              <v-icon icon="$download" start />
              {{ $t('feedback.outputs.download._') }}
            </v-btn>
          </template>
          <v-card :tile="$vuetify.display.smAndDown">
            <v-toolbar color="secondary">
              <v-btn
                icon="$close"
                :title="$t('common.action.close')"
                @click.stop="download.dialog = false"
              />
              <v-toolbar-title>{{ $t('feedback.outputs.download.title') }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-6 d-flex flex-column ga-6">
              <div class="text-subtitle-1 font-weight-medium">
                {{ $t('feedback.outputs.download.subtitle') }}
              </div>
              <v-alert v-if="message" type="success" variant="outlined">
                {{ message }}
              </v-alert>
              <v-alert v-if="retry.retryIn" type="warning" variant="outlined">
                {{ retryMessage }}
              </v-alert>
              <v-btn
                color="secondary"
                :disabled="!!retry.retryIn"
                size="x-large"
                @click.stop="downloadFeedback"
              >
                <v-icon icon="fas fa-paper-plane" start />
                {{ $t('feedback.outputs.download.send') }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>
  </v-col>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import axios, { HttpStatusCode } from 'axios';
import { defineComponent } from 'vue';

import type { FeedbackOutput } from '@intake24/common/feedback';
import { Errors } from '@intake24/common/util';
import { downloadFile } from '@intake24/ui';
import { useLoading } from '@intake24/ui/stores';

export default defineComponent({
  name: 'FeedbackOutputs',

  props: {
    outputs: {
      type: Array as PropType<FeedbackOutput[]>,
      default: () => [],
    },
    surveyId: {
      type: String,
      required: true,
    },
    submissions: {
      type: Array as PropType<string[]>,
    },
  },

  data() {
    return {
      download: {
        dialog: false,
      },
      email: {
        dialog: false,
        form: {
          email: '',
          emailConfirm: '',
        },
        errors: new Errors(),
      },
      message: null as string | null,
      retry: {
        interval: undefined as number | undefined,
        retryIn: 0,
      },
    };
  },

  computed: {
    retryMessage(): string {
      return this.$t('feedback.outputs.retry', { secs: this.retry.retryIn });
    },
  },

  beforeUnmount() {
    this.clearFeedbackInterval();
  },

  methods: {
    async downloadFeedback() {
      const loading = useLoading();
      loading.addItem('feedback-download');

      try {
        const { surveyId: survey, submissions } = this;
        const lang = this.$i18n.locale;

        const res = await this.$http.get(`user/feedback`, {
          params: { lang, survey, submissions },
          responseType: 'arraybuffer',
          headers: { accept: 'application/pdf' },
        });
        downloadFile(res, `Intake24-MyFeedback-${new Date().toISOString().substring(0, 10)}.pdf`);

        this.message = this.$t('feedback.outputs.download.sent');
      }
      catch (err) {
        this.message = null;

        if (axios.isAxiosError(err)) {
          const { response: { status, headers = {} } = {} } = err;

          if (status === HttpStatusCode.TooManyRequests)
            this.setFeedbackInterval(Number.parseInt(headers['retry-after']?.toString() ?? '60', 10));
        }
      }
      finally {
        loading.removeItem('feedback-download');
      }
    },

    async emailFeedback() {
      const loading = useLoading();
      loading.addItem('feedback-email');

      try {
        const {
          email: { form },
          surveyId: survey,
          submissions,
        } = this;
        const lang = this.$i18n.locale;

        await this.$http.post(`user/feedback`, { ...form, lang, survey, submissions });

        this.email.form = { email: '', emailConfirm: '' };
        this.message = this.$t('feedback.outputs.email.sent');
      }
      catch (err) {
        this.message = null;

        if (axios.isAxiosError(err)) {
          const { response: { status, data = {}, headers = {} } = {} } = err;

          if (status === HttpStatusCode.BadRequest && 'errors' in data) {
            this.email.errors.record(data.errors);
            return;
          }

          if (status === HttpStatusCode.TooManyRequests) {
            this.setFeedbackInterval(Number.parseInt(headers['retry-after']?.toString() ?? '60', 10));
            return;
          }

          throw err;
        }
      }
      finally {
        loading.removeItem('feedback-email');
      }
    },

    feedbackInterval() {
      this.retry.retryIn -= this.retry.retryIn < 5 ? this.retry.retryIn : 5;

      if (!this.retry.retryIn)
        this.clearFeedbackInterval();
    },

    setFeedbackInterval(retryIn = 60) {
      if (this.retry.interval)
        clearInterval(this.retry.interval);

      this.retry = {
        retryIn,
        // @ts-expect-error - node types
        interval: setInterval(this.feedbackInterval, 5000),
      };
    },

    clearFeedbackInterval() {
      if (this.retry.interval)
        clearInterval(this.retry.interval);

      this.retry = { retryIn: 0, interval: undefined };
    },

    printFeedback() {
      window.print();
    },
  },
});
</script>

<style lang="scss" scoped></style>
