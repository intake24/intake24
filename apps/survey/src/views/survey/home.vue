<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <v-row justify="center" :no-gutters="$vuetify.display.mobile">
      <v-col cols="12" lg="9">
        <v-card :tile="$vuetify.display.mobile">
          <!-- Survey info -->
          <v-card-title class="text-h5 font-weight-medium mb-2 pt-4">
            {{ $t('survey.welcome._') }}
          </v-card-title>
          <v-card-subtitle class="pb-4">
            {{ $t('survey.welcome.subtitle') }}
          </v-card-subtitle>
          <v-divider />
          <v-list class="list__no-wrap" lines="two">
            <v-list-subheader>{{ $t('survey.info') }}</v-list-subheader>
            <v-list-item>
              <v-list-item-title>{{ $t('survey._') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ parameters?.name }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>{{ $t('survey.states._') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ $t(`survey.states.${parameters?.state}`) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-divider />
          <!-- Recall info -->
          <template v-if="recallAllowed">
            <v-list class="list__no-wrap">
              <v-list-subheader>{{ $t('recall.info') }}</v-list-subheader>
              <template v-if="limitReached">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="error" size="large">
                      fas fa-ban
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    {{ $t(`recall.limitReached.${dailyLimitReached ? 'daily' : 'total'}`) }}
                  </v-list-item-title>
                </v-list-item>
              </template>
              <template v-else-if="hasFinished">
                <v-list-item link>
                  <template #prepend>
                    <v-icon color="info" size="large">
                      $check
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    {{ $t('recall.finishedAt', { finishedAt: endTime?.toLocaleString() }) }}
                  </v-list-item-title>
                  <template #append>
                    <v-list-item-action v-if="$vuetify.display.mdAndUp">
                      <v-btn
                        block
                        color="primary"
                        rounded
                        :title="$t('recall.start.another')"
                        variant="outlined"
                        @click.stop="startRecall"
                      >
                        <v-icon start>
                          fas fa-beat fa-play
                        </v-icon>
                        {{ $t('recall.start.another') }}
                      </v-btn>
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item v-if="$vuetify.display.smAndDown" class="justify-end">
                  <v-btn
                    block
                    color="primary"
                    rounded
                    size="large"
                    :title="$t('recall.start.another')"
                    variant="outlined"
                    @click.stop="startRecall"
                  >
                    <v-icon start>
                      fas fa-beat fa-play
                    </v-icon>
                    {{ $t('recall.start.another') }}
                  </v-btn>
                </v-list-item>
              </template>
              <template v-else-if="hasStarted">
                <v-list-item link>
                  <template #prepend>
                    <v-icon color="info" size="large">
                      $pause
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    {{ $t('recall.startedAt', { startedAt: startTime?.toLocaleString() }) }}
                  </v-list-item-title>
                  <template #append>
                    <v-list-item-action v-if="$vuetify.display.mdAndUp" class="align-stretch">
                      <v-btn
                        class="me-2"
                        color="info"
                        rounded
                        :title="$t('recall.continue')"
                        :to="{ name: 'survey-recall', params: { surveyId } }"
                        variant="outlined"
                      >
                        <v-icon class="fa-beat" start>
                          $pause
                        </v-icon>
                        {{ $t('recall.continue') }}
                      </v-btn>
                      <confirm-dialog
                        :label="$t('recall.abort.label')"
                        @confirm="cancelRecall"
                      >
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="error"
                            rounded
                            :title="$t('recall.abort.label')"
                            variant="outlined"
                          >
                            <v-icon start>
                              $cancel
                            </v-icon>
                            {{ $t('recall.abort._') }}
                          </v-btn>
                        </template>
                        {{ $t('recall.abort.confirm') }}
                      </confirm-dialog>
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item v-if="$vuetify.display.smAndDown" class="justify-sm-end">
                  <confirm-dialog
                    :label="$t('recall.abort.label')"
                    @confirm="cancelRecall"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        class="flex-grow-1 flex-sm-grow-0 me-2"
                        color="error"
                        rounded
                        size="large"
                        :title="$t('recall.abort.label')"
                        variant="outlined"
                      >
                        <v-icon start>
                          $cancel
                        </v-icon>
                        {{ $t('recall.abort._') }}
                      </v-btn>
                    </template>
                    {{ $t('recall.abort.confirm') }}
                  </confirm-dialog>
                  <v-btn
                    class="flex-grow-1 flex-sm-grow-0"
                    color="info"
                    rounded
                    size="large"
                    :title="$t('recall.continue')"
                    :to="{ name: 'survey-recall', params: { surveyId } }"
                    variant="outlined"
                  >
                    <v-icon class="fa-beat" start>
                      $pause
                    </v-icon>
                    {{ $t('recall.continue') }}
                  </v-btn>
                </v-list-item>
              </template>
              <template v-else>
                <v-list-item link>
                  <template #prepend>
                    <v-icon color="info" size="large">
                      $start
                    </v-icon>
                  </template>
                  <v-list-item-title>{{ $t('recall.none') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action v-if="$vuetify.display.mdAndUp">
                      <v-btn
                        color="primary"
                        rounded
                        :title="$t('recall.start._')"
                        :to="{ name: 'survey-recall', params: { surveyId } }"
                        variant="outlined"
                      >
                        <v-icon class="fa-beat" start>
                          $start
                        </v-icon>
                        {{ $t('recall.start._') }}
                      </v-btn>
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item v-if="$vuetify.display.smAndDown" class="justify-end">
                  <v-btn
                    color="primary"
                    rounded
                    size="large"
                    :title="$t('recall.start._')"
                    :to="{ name: 'survey-recall', params: { surveyId } }"
                    variant="outlined"
                  >
                    <v-icon class="fa-beat" start>
                      $start
                    </v-icon>
                    {{ $t('recall.start._') }}
                  </v-btn>
                </v-list-item>
              </template>
            </v-list>
            <v-divider />
          </template>
          <!-- Feedback info -->
          <template v-if="feedbackAllowed">
            <v-list class="list__no-wrap">
              <v-list-subheader>{{ $t('feedback.info') }}</v-list-subheader>
              <template v-if="feedbackAvailable">
                <v-list-item link>
                  <template #prepend>
                    <v-icon color="info" size="large">
                      $feedback
                    </v-icon>
                  </template>
                  <v-list-item-title>{{ $t('feedback.status.available') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action v-if="$vuetify.display.mdAndUp">
                      <v-btn
                        color="info"
                        rounded
                        :to="{ name: 'feedback-home', params: { surveyId } }"
                        variant="outlined"
                      >
                        <v-icon start>
                          $feedback
                        </v-icon>
                        {{ $t(`feedback._`) }}
                      </v-btn>
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item v-if="$vuetify.display.smAndDown" class="justify-end">
                  <v-btn
                    color="info"
                    rounded
                    size="large"
                    :to="{ name: 'feedback-home', params: { surveyId } }"
                    variant="outlined"
                  >
                    <v-icon start>
                      $feedback
                    </v-icon>
                    {{ $t(`feedback._`) }}
                  </v-btn>
                </v-list-item>
              </template>
              <v-list-item v-else link>
                <template #prepend>
                  <v-icon color="info" size="large">
                    $info
                  </v-icon>
                </template>
                <v-list-item-title>
                  {{
                    $t('feedback.status.lowRecalls', {
                      minRecalls: parameters?.numberOfSubmissionsForFeedback,
                    })
                  }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
            <v-divider />
          </template>
          <!-- Past recalls -->
          <v-card-subtitle class="my-4">
            {{ $t('recall.submissions.past') }}
          </v-card-subtitle>
          <v-card-text class="py-0">
            <template v-if="submissions.length">
              <v-timeline density="compact">
                <v-timeline-item
                  v-for="(submission, idx) in submissions"
                  :key="submission.id"
                  :dot-color="idx % 2 ? 'info' : 'primary'"
                  size="small"
                >
                  <v-row class="pt-1">
                    <v-col>
                      <strong>{{ `${$t('recall.submissions._')} ${idx + 1}` }}</strong>
                      <div class="text-caption">
                        {{ `${new Date(submission.endTime).toLocaleDateString()}` }}
                      </div>
                    </v-col>
                  </v-row>
                </v-timeline-item>
              </v-timeline>
            </template>
            <v-list v-else class="list__no-wrap">
              <v-list-item>
                <template #prepend>
                  <v-icon size="large">
                    $survey
                  </v-icon>
                </template>
                <v-list-item-title>
                  {{ $t('recall.submissions.none') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { mapState } from 'pinia';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { SurveySubmissionAttributes } from '@intake24/common/types/http/admin';
import { userService } from '@intake24/survey/services';
import { useSurvey } from '@intake24/survey/stores';
import { sendGtmEvent } from '@intake24/survey/util';
import { ConfirmDialog } from '@intake24/ui';

export default defineComponent({
  name: 'SurveyHome',

  components: { ConfirmDialog },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const survey = useSurvey();
    const router = useRouter();

    const submissions = ref<SurveySubmissionAttributes[]>([]);
    const startTime = computed(() => survey.data.startTime);
    const endTime = computed(() => survey.data.endTime);

    async function startRecall() {
      await survey.startRecall(true);
      await router.push({ name: 'survey-recall', params: { surveyId: props.surveyId } });
    };

    async function cancelRecall() {
      sendGtmEvent({
        event: 'cancelRecall',
        action: 'cancel',
        scheme_prompts: 'preMeals',
      });
      await survey.cancelRecall();
    };

    onMounted(async () => {
      sendGtmEvent({
        event: 'surveyHome',
        action: 'login',
        scheme_prompts: 'preMeals',
      });
      submissions.value = await userService.submissions(props.surveyId);
    });

    return {
      submissions,
      startTime,
      endTime,
      cancelRecall,
      startRecall,
    };
  },

  computed: {
    ...mapState(useSurvey, [
      'feedbackAllowed',
      'recallAllowed',
      'feedbackAvailable',
      'hasStarted',
      'hasFinished',
      'dailyLimitReached',
      'totalLimitReached',
      'limitReached',
      'parameters',
    ]),
  },
});
</script>

<style lang="scss" scoped></style>
