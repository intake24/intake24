import { describe, expect, it } from 'vitest';

import { getFoodByIndex, getFoodIndexInMeal } from './meal-food';

describe('getFoodByIndex', () => {
  const meals = [
    {
      id: 'meal1',
      foods: [
        { id: 'food1', linkedFoods: [] },
        {
          id: 'food2',
          linkedFoods: [
            { id: 'linkedFood1', linkedFoods: [] },
            {
              id: 'linkedFood2',
              linkedFoods: [
                { id: 'nestedLinkedFood1', linkedFoods: [] },
                { id: 'nestedLinkedFood2', linkedFoods: [{ id: 'deepLinkedFood', linkedFoods: [] }] },
              ],
            },
          ],
        },
      ],
    },
  ] as any;

  it('returns top-level food for empty linked path', () => {
    expect(
      getFoodByIndex(meals, {
        mealIndex: 0,
        foodIndex: 0,
        linkedFoodIndex: [],
      }),
    ).toEqual({ id: 'food1', linkedFoods: [] });
  });

  it('returns directly linked food for single linked index', () => {
    expect(
      getFoodByIndex(meals, {
        mealIndex: 0,
        foodIndex: 1,
        linkedFoodIndex: [0],
      }),
    ).toEqual({ id: 'linkedFood1', linkedFoods: [] });
  });

  it('returns nested linked food for multi-level linked indexes', () => {
    expect(
      getFoodByIndex(meals, {
        mealIndex: 0,
        foodIndex: 1,
        linkedFoodIndex: [1, 1],
      }),
    ).toEqual({ id: 'nestedLinkedFood2', linkedFoods: [{ id: 'deepLinkedFood', linkedFoods: [] }] });
  });

  it('returns deep nested linked food for full linked path', () => {
    expect(
      getFoodByIndex(meals, {
        mealIndex: 0,
        foodIndex: 1,
        linkedFoodIndex: [1, 1, 0],
      }),
    ).toEqual({ id: 'deepLinkedFood', linkedFoods: [] });
  });
});

describe('getFoodIndexInMeal', () => {
  const meal = {
    id: 'meal1',
    foods: [
      { id: 'food1', linkedFoods: [] },
      {
        id: 'food2',
        linkedFoods: [
          { id: 'linkedFood1', linkedFoods: [] },
          {
            id: 'linkedFood2',
            linkedFoods: [
              { id: 'nestedLinkedFood1', linkedFoods: [] },
              { id: 'nestedLinkedFood2', linkedFoods: [{ id: 'deepLinkedFood', linkedFoods: [] }] },
            ],
          },
        ],
      },
    ],
  } as any;

  it('returns top-level food index with empty linked path', () => {
    expect(getFoodIndexInMeal(meal, 'food2')).toEqual({
      foodIndex: 1,
      linkedFoodIndex: [],
    });
  });

  it('returns direct linked food index path', () => {
    expect(getFoodIndexInMeal(meal, 'linkedFood1')).toEqual({
      foodIndex: 1,
      linkedFoodIndex: [0],
    });
  });

  it('returns nested linked food index path recursively', () => {
    expect(getFoodIndexInMeal(meal, 'deepLinkedFood')).toEqual({
      foodIndex: 1,
      linkedFoodIndex: [1, 1, 0],
    });
  });

  it('returns undefined when food does not exist in meal', () => {
    expect(getFoodIndexInMeal(meal, 'missing-food')).toBeUndefined();
  });
});
