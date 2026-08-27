import { beforeEach, describe, expect, it, vi } from 'vitest';

const emit = vi.fn();
const survey = {
  selection: { element: null },
};

vi.mock('@intake24/survey/stores', () => ({
  useSurvey: () => survey,
}));

describe('useMealList', async () => {
  const { useMealList } = await import('./use-meal-list');
  const { GTM_MEAL_LIST: GTM_MEAL_LIST_SOURCE } = await import('@intake24/survey/util');

  beforeEach(() => {
    emit.mockClear();
  });

  it.each(['deleteFood', 'deleteMeal'] as const)(
    'marks %s as originating from MealList',
    (type) => {
      const { action } = useMealList({ meals: [] }, { emit });

      action(type, 'entity-id');

      expect(emit).toHaveBeenCalledWith('action', type, 'entity-id', {
        trackingSource: GTM_MEAL_LIST_SOURCE,
      });
    },
  );

  it('preserves parameters for non-deletion actions', () => {
    const { action } = useMealList({ meals: [] }, { emit });
    const params = { origin: 'test' };

    action('editFood', 'food-id', params);

    expect(emit).toHaveBeenCalledWith('action', 'editFood', 'food-id', params);
  });
});
