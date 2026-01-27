import type { ComponentType } from '@intake24/common/prompts';
import type { Selection } from '@intake24/common/surveys';

import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

import { copy } from '@intake24/common/util';
import { useSurvey } from '@intake24/survey/stores/survey';

export type RecallLogPrompt = {
  type: ComponentType;
  applicable: boolean;
  reason: string;
};

export type RecallLogEntry = {
  selection: Selection;
  prompts: RecallLogPrompt[];
};

export const recallLog = defineStore('recall-log', () => {
  const survey = useSurvey();

  const entries = shallowRef<RecallLogEntry[]>([{ selection: copy(survey.selection), prompts: [] }]);

  function selectionChanged(selection: Selection) {
    entries.value.push({ selection: copy(selection), prompts: [] });
  };

  function promptCheck(type: ComponentType, applicable: boolean, reason: string) {
    entries.value[entries.value.length - 1].prompts.push({ type, applicable, reason });
  };

  return {
    entries,
    selectionChanged,
    promptCheck,
  };
});
