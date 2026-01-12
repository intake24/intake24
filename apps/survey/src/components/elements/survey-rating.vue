<template>
  <v-sheet class="d-flex flex-column align-center" :class="{ 'feedback-section': type === 'feedback' }">
    <h2 class="text-h2 font-weight-medium text-center mb-4">
      {{ $t(`${type}.rating.title`) }}
    </h2>
    <v-rating
      v-model="form.rating"
      class="my-4"
      color="primary"
      hover
      length="5"
      :readonly="sent"
      @update:model-value="dialog = true"
    >
      <template #item="{ props }">
        <v-icon
          v-bind="props"
          class="mx-4"
          color="primary"
          :size="$vuetify.display.smAndDown ? 24 : 42"
        />
      </template>
    </v-rating>
    <v-dialog
      v-model="dialog"
      :fullscreen="$vuetify.display.smAndDown"
      max-width="600px"
      transition="dialog-bottom-transition"
    >
      <v-card :tile="$vuetify.display.mobile">
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" @click.stop="close" />
          <v-toolbar-title>{{ $t(`${type}.rating._`) }}</v-toolbar-title>
        </v-toolbar>
        <h3 class="text-h3 font-weight-medium text-center mt-3">
          {{ $t(`${type}.rating.title`) }}
        </h3>
        <v-form @keydown="errors.clear()" @submit.prevent="rate">
          <v-card-text>
            <v-container>
              <v-row>
                <v-col class="d-flex justify-center" cols="12">
                  <v-rating
                    v-model="form.rating"
                    color="primary"
                    hover
                    length="5"
                  >
                    <template #item="{ props }">
                      <v-icon
                        v-bind="props"
                        class="mx-4"
                        color="primary"
                        :size="$vuetify.display.smAndDown ? 24 : 42"
                      />
                    </template>
                  </v-rating>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.comment"
                    :counter="500"
                    :error-messages="errors.get('comment')"
                    hide-details="auto"
                    :label="$t(`${type}.rating.comment`)"
                    name="comment"
                    prepend-inner-icon="fas fa-message"
                  />
                </v-col>
              </v-row>
              <v-row justify="center">
                <v-col cols="12" md="8">
                  <v-btn
                    block
                    color="primary"
                    :disabled="errors.any()"
                    rounded
                    size="x-large"
                    :title="$t(`${type}.rating.send`)"
                    type="submit"
                    variant="outlined"
                  >
                    {{ $t(`${type}.rating.send`) }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import axios, { HttpStatusCode } from 'axios';
import { defineComponent, ref, watch } from 'vue';

import type { SurveyRating } from '@intake24/common/surveys';
import type { SurveyRatingRequest } from '@intake24/common/types/http';
import { Errors } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

import { surveyService } from '../../services';
import { useLoading, useMessages } from '../../stores';

export default defineComponent({
  name: 'SurveyRating',

  props: {
    surveyId: {
      type: String,
      required: true,
    },
    submissionId: {
      type: String,
    },
    type: {
      type: String as PropType<SurveyRating>,
      required: true,
    },
  },

  setup(props) {
    const { i18n: { t } } = useI18n();

    const dialog = ref(false);
    const errors = ref(new Errors());
    const sent = ref(false);

    const createForm = (): SurveyRatingRequest => ({
      type: props.type,
      submissionId: props.submissionId,
      rating: 0,
      comment: null,
    });

    const form = ref(createForm());

    const reset = () => {
      form.value = createForm();
    };

    const close = () => {
      dialog.value = false;
    };

    const rate = async () => {
      const loading = useLoading();
      loading.addItem(`${props.type}-rating`);

      try {
        await surveyService.storeRating(props.surveyId, form.value);
        useMessages().info(t(`${props.type}.rating.sent`));
        sent.value = true;
        close();
      }
      catch (err) {
        if (
          axios.isAxiosError(err)
          && err.response?.status === HttpStatusCode.BadRequest
          && 'errors' in err.response.data
        ) {
          errors.value.record(err.response.data.errors);
          return;
        }

        throw err;
      }
      finally {
        loading.removeItem(`${props.type}-rating`);
      }
    };

    watch(dialog, (value) => {
      if (!value && !sent.value)
        reset();
    });

    return {
      dialog,
      createForm,
      form,
      errors,
      close,
      rate,
      reset,
      sent,
    };
  },
});
</script>
