import type { GtmEventParams } from '@intake24/ui/tracking';

import { useGtm } from '@gtm-support/vue-gtm';

import { useSurvey } from '@intake24/survey/stores';

export const GTM_PROMPT_ID_NOT_MAPPED = 'not mapped';
export const GTM_PROMPT_CONTEXT_EVENT = 'promptChanged';

export type PromptTransition = Pick<GtmEventParams, 'action' | 'prompt_id' | 'section'> & {
  prompt_component?: string;
};

type GtmPromptTrackingParams = PromptTransition & {
  previous_prompt_id?: string;
  previous_section?: string;
  previous_prompt_component?: string;
};

type GtmPayload = Omit<GtmEventParams, 'event'> & {
  event?: GtmEventParams['event'] | typeof GTM_PROMPT_CONTEXT_EVENT;
};

type PromptContext = {
  current: PromptTransition | null;
  previous: PromptTransition | null;
};

const promptContext: PromptContext = {
  current: null,
  previous: null,
};

const eventFieldNames = [
  'meal',
  'food',
  'food_category',
  'label',
  'search_term',
  'search_count',
  'percent_scrolled',
  'search_term_order',
  'search_results_count',
  'faq_section_title',
  'faq_question_title',
  'target',
  'target-properties',
  'value',
  'interaction-type',
  'content-name',
  'content-view-name',
] as const;

const clearedEventFields = Object.fromEntries(eventFieldNames.map(field => [field, null]));

function mealName() {
  const name = useSurvey().selectedMealOptional?.name;

  return name ? name.en ?? Object.values(name)[0] : undefined;
}

function currentFields(prompt: PromptTransition | null): GtmPromptTrackingParams {
  return {
    prompt_id: prompt?.prompt_id ?? GTM_PROMPT_ID_NOT_MAPPED,
    ...(prompt?.section && { section: prompt.section }),
    ...(prompt?.prompt_component && { prompt_component: prompt.prompt_component }),
    ...(prompt?.action && { action: prompt.action }),
  };
}

function previousFields(prompt: PromptTransition | null): Partial<GtmPromptTrackingParams> {
  return {
    ...(prompt?.prompt_id && { previous_prompt_id: prompt.prompt_id }),
    ...(prompt?.section && { previous_section: prompt.section }),
    ...(prompt?.prompt_component && { previous_prompt_component: prompt.prompt_component }),
  };
}

function promptFields(context: PromptContext): GtmPromptTrackingParams {
  return {
    ...currentFields(context.current),
    ...previousFields(context.previous),
  };
}

function defaultFields() {
  const survey = useSurvey();

  return {
    uxSessionId: survey.data.uxSessionId,
    uxUserId: survey.user?.userId || '',
    noninteraction: false,
  };
}

function buildEvent(params: GtmPayload) {
  const context = promptFields(promptContext);
  const meal = mealName();

  return {
    ...clearedEventFields,
    ...defaultFields(),
    ...(meal && { meal }),
    ...context,
    ...params,
    prompt_id: params.prompt_id || context.prompt_id,
  };
}

export function recordPromptTransition(transition: PromptTransition | null): void {
  if (transition) {
    promptContext.previous = promptContext.current;
    promptContext.current = {
      ...transition,
      prompt_id: transition.prompt_id || GTM_PROMPT_ID_NOT_MAPPED,
    };
  }
  else {
    promptContext.current = null;
    promptContext.previous = null;
  }

  window.dataLayer?.push(buildEvent({
    event: GTM_PROMPT_CONTEXT_EVENT,
  }));
}

export function sendGtmEvent(params: GtmEventParams): void {
  try {
    useGtm()?.trackEvent(buildEvent(params));
  }
  catch (e) {
    console.error('Error sending GTM event:', e);
  }
}
