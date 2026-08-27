import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackEvent = vi.fn();
const survey = {
  data: { uxSessionId: 'ux-session-id' },
  user: { userId: 'ux-user-id' },
  selectedMealOptional: undefined as { name: Record<string, string> } | undefined,
};

vi.mock('@gtm-support/vue-gtm', () => ({
  useGtm: () => ({ trackEvent }),
}));

vi.mock('@intake24/survey/stores', () => ({
  useSurvey: () => survey,
}));

describe('sendGtmEvent', async () => {
  const gtmEvent = await import('./gtmEvent');

  beforeEach(() => {
    trackEvent.mockClear();
    survey.selectedMealOptional = undefined;
    gtmEvent.recordPromptTransition(null);
    window.dataLayer = [];
  });

  it('sets prompt_id to not mapped when no prompt is supplied', () => {
    gtmEvent.sendGtmEvent({
      event: 'surveyLogout',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'surveyLogout',
      noninteraction: false,
      prompt_id: 'not mapped',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('sets prompt_id to not mapped when prompt is empty', () => {
    gtmEvent.sendGtmEvent({
      event: 'foodSearch',
      prompt_id: '',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      noninteraction: false,
      prompt_id: 'not mapped',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('preserves mapped prompt ids', () => {
    gtmEvent.sendGtmEvent({
      event: 'foodSearch',
      prompt_id: 'food-search-prompt',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      noninteraction: false,
      prompt_id: 'food-search-prompt',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('uses current prompt context when prompt is not supplied on the event', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      prompt_component: 'meal-time-prompt',
    });

    gtmEvent.sendGtmEvent({
      event: 'surveyLogout',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'surveyLogout',
      noninteraction: false,
      prompt_component: 'meal-time-prompt',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('keeps explicit event prompt id when current prompt context is set', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      prompt_component: 'meal-time-prompt',
    });

    gtmEvent.sendGtmEvent({
      event: 'foodSearch',
      prompt_id: 'food-search-prompt',
      section: 'foods',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      noninteraction: false,
      prompt_component: 'meal-time-prompt',
      prompt_id: 'food-search-prompt',
      section: 'foods',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('pushes prompt context to dataLayer for GTM automatic events', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'meal-add-prompt',
      section: 'preMeals',
      prompt_component: 'meal-add-prompt',
    });
    window.dataLayer = [];

    gtmEvent.recordPromptTransition({
      action: 'editMeal',
      prompt_id: 'edit-meal-prompt',
      section: 'preFoods',
      prompt_component: 'edit-meal-prompt',
    });

    expect(window.dataLayer).toContainEqual(expect.objectContaining(
      {
        action: 'editMeal',
        event: 'promptChanged',
        noninteraction: false,
        prompt_component: 'edit-meal-prompt',
        prompt_id: 'edit-meal-prompt',
        previous_prompt_component: 'meal-add-prompt',
        previous_prompt_id: 'meal-add-prompt',
        previous_section: 'preMeals',
        section: 'preFoods',
        uxSessionId: 'ux-session-id',
        uxUserId: 'ux-user-id',
      },
    ));
  });

  it('clears event-scoped fields on prompt context events', () => {
    gtmEvent.recordPromptTransition({
      action: 'next',
      prompt_id: 'drink-scale-prompt',
      section: 'foods',
      prompt_component: 'drink-scale-prompt',
    });

    expect(window.dataLayer).toContainEqual(expect.objectContaining({
      event: 'promptChanged',
      faq_question_title: null,
      faq_section_title: null,
      food: null,
      food_category: null,
      label: null,
      meal: null,
      percent_scrolled: null,
      search_count: null,
      search_results_count: null,
      search_term: null,
      search_term_order: null,
      target: null,
      'content-name': null,
      'content-view-name': null,
      'interaction-type': null,
      'target-properties': null,
      value: null,
    }));
  });

  it('clears stale event-scoped fields before applying custom event fields', () => {
    gtmEvent.sendGtmEvent({
      event: 'foodSearch',
      search_term: 'juice',
      search_count: 1,
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      faq_question_title: null,
      faq_section_title: null,
      food: null,
      food_category: null,
      label: null,
      meal: null,
      percent_scrolled: null,
      search_count: 1,
      search_results_count: null,
      search_term: 'juice',
      search_term_order: null,
    }));
  });

  it('uses the selected meal when an event does not provide one', () => {
    survey.selectedMealOptional = {
      name: { en: 'Breakfast' },
    };

    gtmEvent.sendGtmEvent({
      event: 'selectFood',
      food: 'Apple juice',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'selectFood',
      food: 'Apple juice',
      meal: 'Breakfast',
    }));
  });

  it('keeps explicit event meal when selected meal is available', () => {
    survey.selectedMealOptional = {
      name: { en: 'Breakfast' },
    };

    gtmEvent.sendGtmEvent({
      event: 'deleteMeal',
      meal: 'Lunch',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'deleteMeal',
      meal: 'Lunch',
    }));
  });

  it('adds previous prompt context to custom events', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'edit-meal-prompt',
      section: 'preFoods',
      prompt_component: 'edit-meal-prompt',
    });

    gtmEvent.recordPromptTransition({
      action: 'next',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      prompt_component: 'meal-time-prompt',
    });

    gtmEvent.sendGtmEvent({
      event: 'surveyLogout',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'surveyLogout',
      noninteraction: false,
      action: 'next',
      previous_prompt_component: 'edit-meal-prompt',
      previous_prompt_id: 'edit-meal-prompt',
      previous_section: 'preFoods',
      prompt_component: 'meal-time-prompt',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('keeps explicit event action when current prompt context has prompt change action', () => {
    gtmEvent.recordPromptTransition({
      action: 'next',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      prompt_component: 'meal-time-prompt',
    });

    gtmEvent.sendGtmEvent({
      event: 'deleteMeal',
      action: 'deleteMeal',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'deleteMeal',
      action: 'deleteMeal',
      noninteraction: false,
      prompt_component: 'meal-time-prompt',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it('clears prompt context when transition is reset', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'edit-meal-prompt',
      section: 'preFoods',
      prompt_component: 'edit-meal-prompt',
    });
    gtmEvent.recordPromptTransition({
      action: 'next',
      prompt_id: 'meal-time-prompt',
      section: 'preFoods',
      prompt_component: 'meal-time-prompt',
    });

    gtmEvent.recordPromptTransition(null);
    trackEvent.mockClear();

    gtmEvent.sendGtmEvent({
      event: 'surveyLogout',
    });

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'surveyLogout',
      noninteraction: false,
      prompt_id: 'not mapped',
      uxSessionId: 'ux-session-id',
      uxUserId: 'ux-user-id',
    }));
  });

  it.each(['dietary_feedback', 'follow_up'] as const)(
    'tracks %s link offers without exposing a URL',
    (linkKind) => {
      gtmEvent.sendFeedbackLinkEvent('feedbackLinkOffered', linkKind);

      expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        event: 'feedbackLinkOffered',
        link_kind: linkKind,
        noninteraction: true,
      }));
      expect(trackEvent.mock.calls[0][0]).not.toHaveProperty('url');
    },
  );

  it.each(['dietary_feedback', 'follow_up'] as const)(
    'tracks %s link clicks as interactions',
    (linkKind) => {
      gtmEvent.sendFeedbackLinkEvent('feedbackLinkClicked', linkKind);

      expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        event: 'feedbackLinkClicked',
        link_kind: linkKind,
        noninteraction: false,
      }));
    },
  );

  it('tracks carousel arrow navigation as an action using current prompt context', () => {
    gtmEvent.recordPromptTransition({
      prompt_id: 'instructions-carousel',
      prompt_component: 'info-prompt',
      section: 'preMeals',
    });
    trackEvent.mockClear();

    gtmEvent.sendNavigateCarouselEvent('carousel-back');

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'carousel-back',
      event: 'navigateCarousel',
      noninteraction: false,
      prompt_id: 'instructions-carousel',
      prompt_component: 'info-prompt',
    }));
    expect(trackEvent.mock.calls[0][0]).not.toHaveProperty('direction');
  });
});
