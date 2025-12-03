<template>
  <v-dialog v-model="dialog" fullscreen :scrim="false" transition="dialog-bottom-transition">
    <template #activator="{ props }">
      <slot name="activator" v-bind="props">
        <v-btn
          color="secondary"
          :title="$t('feedback-schemes.preview.title')"
          v-bind="props"
        >
          <v-icon icon="$search" start />
          {{ $t('feedback-schemes.preview._') }}
        </v-btn>
      </slot>
    </template>
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>{{ $t('feedback-schemes.preview.title') }}</v-toolbar-title>
      </v-toolbar>
      <v-container class="pa-0" fluid>
        <h2 class="text-h2 font-weight-medium text-center px-4 pb-4">
          {{ $t('feedback.title') }}
        </h2>
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
          <feedback-custom-section
            v-for="section in customSections"
            :key="`custom-${section.id}`"
            v-bind="{ class: section.class, section }"
          />
        </div>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import type { FeedbackImage, FeedbackSchemeEntry } from '@intake24/common/types/http/admin';
import {
  buildCardParams,
  buildTopFoods,
  createFeedbackService,
  FeedbackCards,
  FeedbackCustomSection,
  FeedbackMeals,
  FeedbackTopFoods,
  useFeedback,
} from '@intake24/ui/feedback';

import * as previewData from './preview-data';

export default defineComponent({
  name: 'FeedbackPreview',

  components: { FeedbackCards, FeedbackCustomSection, FeedbackMeals, FeedbackTopFoods },

  props: {
    feedbackScheme: {
      type: Object as PropType<FeedbackSchemeEntry>,
      required: true,
    },
    images: {
      type: Array as PropType<FeedbackImage[]>,
      default: () => [],
    },
  },

  setup(props) {
    const feedbackService = createFeedbackService();
    const dialog = ref(false);

    const imageMap = computed(() => props.images.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.url;
      return acc;
    }, {}));

    const scheme = computed(() => ({
      ...props.feedbackScheme,
      cards: props.feedbackScheme.cards.map(card => ({ ...card, image: imageMap.value[card.image] })),
    }));

    const {
      cards,
      customSections,
      feedbackDicts,
      standardSections,
      showCards,
      showMeals,
      showTopFoods,
      topFoods,
    }
      = useFeedback(scheme);

    const buildFeedback = async () => {
      const results = await feedbackService.getFeedbackResults({
        cards: scheme.value.cards,
        groups: scheme.value.demographicGroups,
        henryCoefficients: scheme.value.henryCoefficients,
        physicalData: previewData.physicalData,
        submissions: previewData.submissions,
      });

      feedbackDicts.value = results.feedbackDicts;

      const {
        surveyStats,
        feedbackData: { nutrientTypes },
      } = feedbackDicts.value;

      const selected = previewData.submissions.map(({ id }) => id);

      const foods = surveyStats.getReducedFoods(selected);
      const averageIntake = surveyStats.getAverageIntake(selected);
      const fruitAndVegPortions = surveyStats.getFruitAndVegPortions(selected);

      cards.value = buildCardParams(results.feedbackDicts.cards, {
        foods,
        userDemographic: results.userDemographic,
        averageIntake,
        fruitAndVegPortions,
      });
      topFoods.value = buildTopFoods(scheme.value.topFoods, foods, nutrientTypes);
    };

    const close = () => {
      dialog.value = false;
    };

    onMounted(async () => {
      await buildFeedback();
    });

    watch(scheme, async () => {
      await buildFeedback();
    }, { deep: true });

    return {
      dialog,
      cards,
      customSections,
      close,
      feedbackDicts,
      standardSections,
      showCards,
      showMeals,
      showTopFoods,
      topFoods,
      ...previewData,
    };
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
