import type { StringValue } from 'ms';

import { z } from 'zod';

import { singlePrompt } from '../prompts';
import { meal } from './meals';
import { schemeSettings } from './scheme';

export * from './search-settings';

export const surveyAuthModes = ['username', 'token'] as const;
export type SurveyAuthMode = (typeof surveyAuthModes)[number];

export const surveyRatings = ['recall', 'feedback'] as const;
export type SurveyRating = (typeof surveyRatings)[number];

export const surveyStatuses = ['notStarted', 'active', 'suspended', 'completed'] as const;
export type SurveyStatus = (typeof surveyStatuses)[number];

export const schemeOverrides = z.object({
  meals: meal.array(),
  prompts: singlePrompt.array(),
  settings: schemeSettings.partial(),
});
export type SchemeOverrides = z.infer<typeof schemeOverrides>;

export const defaultOverrides: SchemeOverrides = {
  meals: [],
  prompts: [],
  settings: {},
};

export const sessionSettings = z.object({
  store: z.boolean(), // TODO: possibly extend to be more configurable to -> z.union([z.boolean(), z.enum(['client', 'server']), z.enum(['client', 'server']).array()]),
  age: z.custom<StringValue>(() => z.string().regex(/^\d+([mhdwy]|min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks|yr|yrs|year|years)$/)).nullable(),
  fixed: z.custom<`${StringValue}+${StringValue}`>(() => z.string().regex(/^\d+([dwy]|day|days|week|weeks|yr|yrs|year|years)\+\d+([smh]|sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours)$/)).nullable(),
});

export type SessionSettings = z.infer<typeof sessionSettings>;

export const defaultSessionSettings: SessionSettings = {
  store: true,
  age: '12h',
  fixed: '1d+0h',
};
