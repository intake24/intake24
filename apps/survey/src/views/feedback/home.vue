<template>
  <div>
    <v-sheet color="white py-4">
      <h1 v-if="surveyName" class="text-h1 font-weight-medium text-center px-4 pb-4">
        {{ surveyName }}
      </h1>
      <h2 class="text-h2 font-weight-medium text-center px-4 pb-4">
        {{ $t('feedback.title', { name: userName ? `${userName}'s` : '' }) }}
      </h2>
      <v-container class="container-max">
        <v-row class="d-print-none" justify="center">
          <v-col cols="12" lg="7" md="8" xl="6">
            <v-row justify="space-around">
              <!-- @vue-expect-error class prop issues -->
              <feedback-user-info
                v-if="userDemographic?.hasData()"
                v-bind="{ surveyId, userDemographic }"
              />
              <feedback-outputs
                v-if="!!outputs.length"
                v-bind="{
                  outputs,
                  submissions:
                    submissions.length !== selectedSubmissions.length
                      ? selectedSubmissions
                      : undefined,
                  surveyId,
                }"
              />
            </v-row>
          </v-col>
        </v-row>
        <v-row v-if="showSubmissions" class="d-print-none" justify="center">
          <v-col cols="12" lg="7" md="8" xl="6">
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title
                  class="text-subtitle-1 font-weight-medium"
                  color="grey-lighten-4"
                >
                  {{ $t('recall.submissions.title') }}
                  ({{
                    submissions.length === selectedSubmissions.length
                      ? $t('recall.submissions.all')
                      : selectedSubmissions.length
                  }})
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pa-0">
                  <v-list
                    v-model:selected="selectedSubmissions"
                    density="compact"
                    select-strategy="leaf"
                    @update:selected="buildFeedback"
                  >
                    <v-list-item
                      v-for="(submission, idx) in submissions"
                      :key="submission.id"
                      :value="submission.id"
                    >
                      <template #prepend="{ isSelected, select }">
                        <v-list-item-action>
                          <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                        </v-list-item-action>
                      </template>
                      <v-list-item-title>
                        {{ `${$t('recall.submissions._')} ${idx + 1}` }} |
                        {{ `${new Date(submission.endTime).toLocaleDateString()}` }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
        <v-row v-if="hasMissingFoods" justify="center">
          <v-col cols="12" lg="7" md="8" xl="6">
            <v-alert class="mb-0" color="info" icon="fas fa-circle-exclamation">
              {{ $t('feedback.missingFoods') }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
    <div v-if="feedbackScheme && feedbackDicts && standardSections" class="d-flex flex-column">
      <!-- @vue-expect-error class prop issues -->
      <feedback-cards
        v-if="showCards"
        v-bind="{ class: standardSections.cards, cards }"
      />
      <feedback-top-foods
        v-if="showTopFoods"
        v-bind="{ class: standardSections.topFoods, topFoods }"
      />
      <!-- @vue-expect-error class prop issues -->
      <feedback-meals
        v-if="showMeals"
        :class="standardSections.meals"
        :config="feedbackScheme.meals"
        :nutrient-types="feedbackDicts.feedbackData.nutrientTypes"
        :submissions="submissions"
        :survey-stats="feedbackDicts.surveyStats"
      />
      <survey-rating
        v-if="showRating"
        v-bind="{ class: standardSections.rating, surveyId, type: 'feedback' }"
      />
      <feedback-custom-section
        v-for="section in customSections"
        :key="`custom-${section.id}`"
        v-bind="{ class: section.class, section }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { FeedbackSubmissionEntry, Pagination } from '@intake24/common/types/http';
import type { UserDemographic } from '@intake24/ui/feedback';

import { computed, defineComponent, ref } from 'vue';

import { SurveyRating } from '@intake24/survey/components/elements';
import { userService } from '@intake24/survey/services';
import { useLoading, useSurvey } from '@intake24/survey/stores';
import {
  buildCardParams,
  buildTopFoods,
  createFeedbackService,
  FeedbackCards,
  FeedbackCustomSection,
  FeedbackMeals,
  FeedbackOutputs,
  FeedbackTopFoods,
  FeedbackUserInfo,
  useFeedback,
} from '@intake24/ui/feedback';

export default defineComponent({
  name: 'FeedbackHome',

  components: {
    FeedbackCards,
    FeedbackCustomSection,
    FeedbackMeals,
    FeedbackOutputs,
    FeedbackTopFoods,
    FeedbackUserInfo,
    SurveyRating,
  },

  beforeRouteEnter({ params }, from, next) {
    if (useSurvey().feedbackAllowed)
      next();
    else
      next({ name: 'survey-home', params });
  },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  setup() {
    const feedbackService = createFeedbackService();

    const survey = useSurvey();
    const parameters = computed(() => survey.parameters);
    const surveyName = computed(() => parameters.value?.name);
    const userName = computed(() => survey.user?.name);
    const feedbackScheme = computed(() => parameters.value?.feedbackScheme);
    const outputs = computed(() => feedbackScheme.value?.outputs ?? []);

    const userDemographic = ref<UserDemographic | null>(null);
    const selectedSubmissions = ref<string[]>([]);

    const {
      cards,
      customSections,
      feedbackDicts,
      standardSections,
      showCards,
      showMeals,
      showRating,
      showSubmissions,
      showTopFoods,
      topFoods,
    } = useFeedback(feedbackScheme);

    const submissions = computed(() => feedbackDicts.value?.surveyStats.submissions ?? []);
    const hasMissingFoods = computed(() => !!submissions.value.reduce((acc, curr) =>
      acc + curr.meals.reduce((a, b) => a + b.missingFoods.length, 0), 0));

    return {
      feedbackService,
      hasMissingFoods,
      userDemographic,
      selectedSubmissions,
      cards,
      customSections,
      feedbackDicts,
      standardSections,
      topFoods,
      showCards,
      showMeals,
      showRating,
      showSubmissions,
      showTopFoods,
      parameters,
      feedbackScheme,
      outputs,
      surveyName,
      submissions,
      userName,
    };
  },

  async mounted() {
    const { feedbackScheme, surveyId } = this;

    if (!feedbackScheme) {
      this.$router.push({ name: 'feedback-error', params: { surveyId } });
      return;
    }

    const loading = useLoading();
    loading.addItem('feedback-initial-load');

    try {
      const { cards, demographicGroups: groups, henryCoefficients } = feedbackScheme;

      const { physicalData, submissions } = await this.getUserData(surveyId);

      if (feedbackScheme.physicalDataFields.some(item => physicalData[item] === null)) {
        this.$router.push({ name: 'feedback-physical-data', params: { surveyId } });
        return;
      }

      const { feedbackDicts, userDemographic } = await this.feedbackService.getFeedbackResults({
        cards,
        groups,
        henryCoefficients,
        physicalData,
        submissions,
      });

      this.feedbackDicts = feedbackDicts;
      this.userDemographic = userDemographic;

      this.initSelectedSubmissions();
      this.buildFeedback();
    }
    catch (err) {
      await this.$router.push({ name: 'feedback-error', params: { surveyId } });

      throw err;
    }
    finally {
      loading.removeItem('feedback-initial-load');
    }
  },

  methods: {
    async initSelectedSubmissions() {
      const { submissions } = this.$route.query;
      const submissionIds = this.submissions.map(({ id }) => id);

      if (Array.isArray(submissions)) {
        this.selectedSubmissions = submissionIds.filter(id => id && submissions.includes(id));
        await this.$router.replace(this.$route.path);
        return;
      }

      if (typeof submissions === 'string') {
        this.selectedSubmissions = [submissions];
        await this.$router.replace(this.$route.path);
        return;
      }

      this.selectedSubmissions = submissionIds;
    },

    async fetchSubmissions(survey: string): Promise<FeedbackSubmissionEntry[]> {
      const { data: { data, meta } } = await this.$http.get<Pagination<FeedbackSubmissionEntry>>(
        'user/feedback/submissions',
        { params: { survey } },
      );

      if (meta.page >= meta.lastPage)
        return data;

      for (let page = meta.page + 1; page <= meta.lastPage; page++) {
        const { data: { data: pageData } } = await this.$http.get<Pagination<FeedbackSubmissionEntry>>(
          'user/feedback/submissions',
          { params: { survey, page } },
        );

        data.push(...pageData);
      }

      return data;
    },

    async getUserData(surveyId: string) {
      const [physicalData, submissions] = await Promise.all([
        userService.fetchPhysicalData(),
        this.fetchSubmissions(surveyId),
      ]);

      return { physicalData, submissions };
    },

    buildFeedback() {
      const {
        feedbackDicts,
        feedbackScheme,
        selectedSubmissions,
        submissions,
        surveyId,
        userDemographic,
      } = this;

      if (!feedbackDicts || !feedbackScheme || !userDemographic) {
        this.$router.push({ name: 'feedback-error', params: { surveyId } });
        return;
      }

      const {
        cards,
        surveyStats,
        feedbackData: { nutrientTypes },
      } = feedbackDicts;

      const submissionsCount = surveyStats.submissions.length;
      if (!submissionsCount) {
        this.$router.push({ name: 'survey-home', params: { surveyId } });
        return;
      }

      const selected = selectedSubmissions.length
        ? selectedSubmissions
        : submissions.map(({ id }) => id);

      const foods = surveyStats.getReducedFoods(selected);
      const averageIntake = surveyStats.getAverageIntake(selected);
      const fruitAndVegPortions = surveyStats.getFruitAndVegPortions(selected);

      // @ts-expect-error - TODO: fix types
      this.cards = buildCardParams(cards, {
        foods,
        userDemographic,
        averageIntake,
        fruitAndVegPortions,
      });
      this.topFoods = buildTopFoods(feedbackScheme.topFoods, foods, nutrientTypes);
    },
  },
});
</script>

<style lang="scss">
.feedback-section {
  padding-top: 32px !important;
  padding-bottom: 32px !important;

  @media print {
    padding: 0 !important;
  }
}
</style>
