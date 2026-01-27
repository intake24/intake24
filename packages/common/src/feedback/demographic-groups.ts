import { z } from 'zod';

import { localeTranslation, requiredLocaleTranslation } from '../types';
import { cardTypes } from './cards';
import { nutrientRuleTypes, range, sentiments, sexes } from './shared';

export const rangeType = ['age', 'height', 'weight'] as const;
export type RangeType = (typeof rangeType)[number];

export const demographicGroupScaleSector = z.object({
  name: requiredLocaleTranslation,
  summary: localeTranslation,
  description: localeTranslation,
  intake: z.enum(['summary', 'description']).array(),
  range,
  sentiment: z.enum(sentiments),
});

export type DemographicGroupScaleSector = z.infer<typeof demographicGroupScaleSector>;

export const demographicGroup = z.object({
  id: z.string(),
  type: z.enum(cardTypes),
  age: range.nullable(),
  height: range.nullable(),
  weight: range.nullable(),
  nutrientRuleType: z.enum(nutrientRuleTypes),
  nutrientTypeId: z.string().nullable(),
  physicalActivityLevelId: z.string().nullable(),
  scaleSectors: z.array(demographicGroupScaleSector),
  sex: z.enum(sexes).nullable(),
});

export type DemographicGroup = z.infer<typeof demographicGroup>;

export const demographicGroupScaleSectorDefaults: DemographicGroupScaleSector = {
  name: { en: 'Energy' },
  summary: { en: '' },
  description: { en: '' },
  intake: ['summary', 'description'],
  range: { start: 0, end: 10 },
  sentiment: 'good',
};

export const demographicGroupDefaults: DemographicGroup = {
  id: 'demographic-group',
  type: 'character',
  age: null,
  height: null,
  weight: null,
  nutrientRuleType: 'range',
  nutrientTypeId: null,
  physicalActivityLevelId: null,
  sex: null,
  scaleSectors: [{ ...demographicGroupScaleSectorDefaults }],
};
