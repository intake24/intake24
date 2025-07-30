import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FAQSection } from '@intake24/common/types/http/admin';
import { surveyService } from '../services';

export const useFAQs = defineStore('faqs', () => {
  const sections = ref<FAQSection[]>([]);

  async function loadSections(surveyId: string) {
    const data = await surveyService.surveyFAQs(surveyId);

    sections.value = [...data];
  }

  return {
    sections,
    loadSections,
  };
});
