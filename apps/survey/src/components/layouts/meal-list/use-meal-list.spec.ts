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

  beforeEach(() => {
    emit.mockClear();
  });

  it.each(['addFood', 'changeFood', 'mealTime', 'deleteFood', 'deleteMeal'] as const)(
    'marks %s as originating from MealList',
    (type) => {
      const { action } = useMealList({ meals: [] }, { emit }, { fromPersistentMealList: true });

      action(type, 'entity-id');

      expect(emit).toHaveBeenCalledWith('action', type, 'entity-id', undefined, {
        fromPersistentMealList: true,
      });
    },
  );

  it('leaves reviewed-list actions owned by their prompt', () => {
    const { action } = useMealList({ meals: [] }, { emit });

    action('deleteFood', 'food-id');

    expect(emit).toHaveBeenCalledWith('action', 'deleteFood', 'food-id', undefined);
  });
});
