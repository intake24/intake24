import type { ComputedRef } from 'vue';
import type { FeedbackCardParameters } from './cards-builder';
import type { FeedbackDictionaries } from './feedback.service';
import { computed, ref } from 'vue';
import type { FeedbackCustomSection, FeedbackStandardSection } from '@intake24/common/feedback';
import type { FeedbackSchemeResponse } from '@intake24/common/types/http';
import { copy } from '@intake24/common/util';
import { buildTopFoods } from './top-foods';

export function useFeedback(scheme: ComputedRef<FeedbackSchemeResponse | undefined>) {
  const feedbackDicts = ref<FeedbackDictionaries | null>(null);
  const cards = ref<FeedbackCardParameters[]>([]);

  const topFoods = ref(buildTopFoods({ max: 0, colors: [], nutrientTypes: [] }, []));

  const showCards = computed(() => scheme.value?.sections.includes('cards') && cards.value.length);

  const showMeals = computed(() => {
    if (!scheme.value?.sections.includes('meals'))
      return false;

    return !!(scheme.value.meals.chart.nutrients.length || scheme.value.meals.table.fields.length);
  });

  const showRating = computed(() => scheme.value?.sections.includes('rating'));
  const showSubmissions = computed(() => scheme.value?.sections.includes('submissions'));

  const showTopFoods = computed(() => {
    if (!scheme.value?.sections.includes('topFoods'))
      return false;

    return !!topFoods.value.chartData.length;
  });

  const sections = computed(() => {
    const items = copy(scheme.value?.sections ?? []);
    const foundIdx = items.findIndex(item => item === 'submissions');
    if (foundIdx > 0) {
      items.splice(foundIdx, 1);
      items.unshift('submissions');
    }

    return items;
  });
  const hasSubmissionsSection = computed(() => sections.value.includes('submissions'));

  const customSections = computed(() => sections.value.reduce<(FeedbackCustomSection & { class: string[] })[]>((acc, item, idx) => {
    if (typeof item === 'string')
      return acc;

    const colorIdx = hasSubmissionsSection.value ? idx : idx + 1;

    acc.push({ ...item, class: [`order-${idx}`, `${colorIdx % 2 ? 'bg-grey-lighten-4' : 'bg-white'}`] });
    return acc;
  }, []) ?? []);

  const standardSections = computed(() =>
    sections.value.reduce<Record<FeedbackStandardSection, string[]>>((acc, item, idx) => {
      if (typeof item !== 'string')
        return acc;

      const colorIdx = hasSubmissionsSection.value ? idx : idx + 1;

      acc[item] = [`order-${idx}`, `${colorIdx % 2 ? 'bg-grey-lighten-4' : 'bg-white'}`];

      return acc;
    }, {} as Record<FeedbackStandardSection, string[]>),
  );

  return {
    cards,
    customSections,
    feedbackDicts,
    standardSections,
    showCards,
    showMeals,
    showTopFoods,
    showRating,
    showSubmissions,
    topFoods,
  };
}
