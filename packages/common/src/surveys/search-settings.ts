import { z } from 'zod';

export const searchSortingAlgorithms = [
  // 'paRules', Pairwise association not implemented
  'popularity',
  'globalPop',
  'fixed',
] as const;

export type SearchSortingAlgorithm = (typeof searchSortingAlgorithms)[number];

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
