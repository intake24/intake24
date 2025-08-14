import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PromptStates } from '@intake24/common/prompts';
import { drinkScalePrompt } from '@intake24/common/prompts';
import type { EncodedFood, MealState } from '@intake24/common/surveys';
import DrinkScalePrompt from './DrinkScalePrompt.vue';

const prompt = drinkScalePrompt;

const meal: MealState = {
  id: 'meal-1',
  name: { en: 'Breakfast' },
  defaultTime: { hours: 8, minutes: 0 },
  duration: null,
  flags: [],
  customPromptAnswers: {},
  foods: [],
};

const food: EncodedFood = {
  id: 'drink-scale-test',
  type: 'encoded-food',
  data: {
    code: 'drink-scale-test',
    englishName: 'Test Drink',
    localName: 'Test Drink Local',
    groupCode: 'drink-group',
    kcalPer100g: 100,
    reasonableAmount: 100,
    readyMealOption: false,
    sameAsBeforeOption: false,
    portionSizeMethods: [
      {
        method: 'drink-scale',
        description: 'Drink Scale Method',
        imageUrl: 'https://example.com/drink-scale.png',
        useForRecipes: false,
        conversionFactor: 1,
        orderBy: '1',
        parameters: {},
      },
    ],
    associatedFoodPrompts: [],
    brandNames: ['Test Brand'],
    categories: ['Beverages'],
    tags: ['test', 'drink'],
    thumbnailImageUrl: 'https://example.com/drink-thumbnail.png',
  },
  searchTerm: 'Test Drink',
  portionSizeMethodIndex: 0,
  portionSize: null,
  flags: [],
  linkedFoods: [],
  customPromptAnswers: {},
};

const state: PromptStates['drink-scale-prompt'] = {
  portionSize: {
    method: 'drink-scale',
    drinkwareId: '',
    initialFillLevel: 0.9,
    skipFillLevel: false,
    imageUrl: '',
    containerId: undefined,
    containerIndex: undefined,
    fillLevel: 0,
    servingWeight: 0,
    leftoversLevel: 0,
    leftoversWeight: 0,
    leftovers: false,
    quantity: 1,
  },
  panel: 1,
  objectConfirmed: false,
  volumeConfirmed: false,
  leftoversConfirmed: false,
  leftoversPrompt: undefined,
  quantityConfirmed: false,
};

describe('drinkScalePrompt', () => {
  it('renders correctly with required props', async () => {
    const wrapper = mount(DrinkScalePrompt, {
      props: { food, meal, prompt, modelValue: state, section: 'foods' },
    });

    const panels = wrapper.find('.v-expansion-panels');
    const panelItems = panels.findAll('.v-expansion-panel');

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.v-expansion-panels').exists()).toBe(true);
    expect(panelItems).toHaveLength(3);

    expect(wrapper.find('.v-card-actions button').attributes('disabled')).toBe('');
  });
});
