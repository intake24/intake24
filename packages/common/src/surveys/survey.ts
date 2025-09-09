import type { StringValue } from 'ms';
import { z } from 'zod';
import { singlePrompt } from '../prompts';
import { meal } from './meals';
import { schemeSettings } from './scheme';

export const surveyRatings = ['recall', 'feedback'] as const;
export type SurveyRating = (typeof surveyRatings)[number];

export const surveyStatuses = ['notStarted', 'active', 'suspended', 'completed'] as const;
export type SurveyStatus = (typeof surveyStatuses)[number];

export const searchSortingAlgorithms = [
  // 'paRules', Pairwise association not implemented
  'popularity',
  'globalPop',
  'fixed',
] as const;

export type SearchSortingAlgorithm = (typeof searchSortingAlgorithms)[number];

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

export const spellingCorrectionPreferences = ['phonetic', 'edit-distance', 'both'] as const;
export type SpellingCorrectionPreference = typeof spellingCorrectionPreferences[number];

export const surveySearchSettings = z.object({
  collectData: z.boolean(),
  maxResults: z.number().int().min(10).max(100),
  matchScoreWeight: z.number().int().min(0).max(100),
  sortingAlgorithm: z.enum(searchSortingAlgorithms),
  spellingCorrectionPreference: z.enum(spellingCorrectionPreferences),
  minWordLength1: z.number().int().min(2).max(10),
  minWordLength2: z.number().int().min(3).max(10),
  enableEditDistance: z.boolean(),
  enablePhonetic: z.boolean(),
  minWordLengthPhonetic: z.number().int().min(2).max(10),
  firstWordCost: z.number().int().min(0).max(20),
  wordOrderCost: z.number().int().min(0).max(10),
  wordDistanceCost: z.number().int().min(0).max(10),
  unmatchedWordCost: z.number().int().min(0).max(10),
  enableRelevantCategories: z.boolean(),
  relevantCategoryDepth: z.number().int().min(0).max(5),
});
export type SurveySearchSettings = z.infer<typeof surveySearchSettings>;

export const defaultSearchSettings: SurveySearchSettings = {
  collectData: true,
  maxResults: 100,
  matchScoreWeight: 20,
  sortingAlgorithm: 'popularity',
  spellingCorrectionPreference: 'phonetic',
  minWordLength1: 3,
  minWordLength2: 6,
  enableEditDistance: true,
  enablePhonetic: true,
  minWordLengthPhonetic: 3,
  firstWordCost: 0,
  wordOrderCost: 4,
  wordDistanceCost: 1,
  unmatchedWordCost: 8,
  enableRelevantCategories: false,
  relevantCategoryDepth: 0,
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
