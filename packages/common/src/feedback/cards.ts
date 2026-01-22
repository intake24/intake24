import { z } from 'zod';
import { localeTranslation, requiredLocaleTranslation } from '../types';
import { characterSentiment } from './characters';

export const foodGroupThreshold = z.object({
  threshold: z.number(),
  message: localeTranslation,
});

export type FoodGroupThreshold = z.infer<typeof foodGroupThreshold>;

export const baseCard = z.object({
  id: z.string(),
  color: z.string(),
  image: z.string(),
  sentiments: z.array(characterSentiment),
  showRecommendations: z.boolean(),
});

export const character = baseCard.extend({
  type: z.literal('character'),
  nutrientTypeIds: z.string().array(),
});

export type Character = z.infer<typeof character>;

export const nutrientGroupCard = baseCard.extend({
  type: z.literal('nutrient-group'),
  nutrientTypes: z.string().array(),
  high: foodGroupThreshold.nullable(),
  low: foodGroupThreshold.nullable(),
  unit: z.object({
    name: requiredLocaleTranslation,
    description: localeTranslation,
  }),
});

export type NutrientGroupCard = z.infer<typeof nutrientGroupCard>;

export const fiveADayCard = baseCard.extend({
  type: z.literal('five-a-day'),
  high: foodGroupThreshold.nullable(),
  low: foodGroupThreshold.nullable(),
  unit: z.object({
    name: requiredLocaleTranslation,
    description: localeTranslation,
  }),
});

export type FiveADayCard = z.infer<typeof fiveADayCard>;

export const card = z.discriminatedUnion('type', [character, nutrientGroupCard, fiveADayCard]);
export const customCard = z.discriminatedUnion('type', [nutrientGroupCard, fiveADayCard]);

export const cardTypes = ['character', 'nutrient-group', 'five-a-day'] as const;
export type CardType = (typeof cardTypes)[number];

export type Card = z.infer<typeof card>;
export type CustomCard = z.infer<typeof customCard>;

export const cardDefaults: Card[] = [
  {
    id: 'character',
    type: 'character',
    image: 'battery',
    color: '#FFFFFFFF',
    showRecommendations: false,
    nutrientTypeIds: ['1'],
    sentiments: [
      /* {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        name: { en: 'Your battery needs a boost' },
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        name: { en: 'Your battery needs a boost' },
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        name: { en: "Your're so energetic" },
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        name: { en: 'Energy overload' },
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        name: { en: 'Energy overload' },
      }, */
    ],
  },
  {
    id: 'nutrient-group',
    type: 'nutrient-group',
    image: 'battery',
    color: '#FFFFFFFF',
    sentiments: [],
    showRecommendations: false,
    low: {
      threshold: 0,
      message: { en: '' },
    },
    high: {
      threshold: 0,
      message: { en: '' },
    },
    unit: {
      name: { en: '' },
      description: { en: '' },
    },
    nutrientTypes: [],
  },
  {
    id: 'five-a-day',
    type: 'five-a-day',
    image: 'battery',
    color: '#FFFFFFFF',
    sentiments: [],
    showRecommendations: false,
    low: {
      threshold: 0,
      message: { en: '' },
    },
    high: {
      threshold: 0,
      message: { en: '' },
    },
    unit: {
      name: { en: '' },
      description: { en: '' },
    },
  },
];
