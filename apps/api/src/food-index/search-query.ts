import type { SearchSortingAlgorithm, SpellingCorrectionPreference } from '@intake24/common/surveys';

import { defaultSearchSettings } from '@intake24/common/surveys';

export interface OptionalSearchQueryParameters {
  previous?: string[];
  limit?: number;
  rankingAlgorithm?: SearchSortingAlgorithm;
  matchScoreWeight?: number;
  includeHidden?: boolean;
  limitToCategory?: string;
  spellingCorrectionPreference?: SpellingCorrectionPreference;
  minWordLength1?: number;
  minWordLength2?: number;
  enableEditDistance?: boolean;
  enablePhonetic?: boolean;
  minWordLengthPhonetic?: number;
  firstWordCost?: number;
  wordOrderCost?: number;
  wordDistanceCost?: number;
  unmatchedWordCost?: number;
  enableRelevantCategories?: boolean;
  relevantCategoryDepth?: number;
}

export interface SearchQueryParameters {
  localeId: string;
  description: string;
  previous: string[];
  limit: number;
  rankingAlgorithm: SearchSortingAlgorithm;
  matchScoreWeight: number;
  includeHidden: boolean;
  limitToCategory?: string;
  spellingCorrectionPreference: SpellingCorrectionPreference;
  minWordLength1: number;
  minWordLength2: number;
  enableEditDistance: boolean;
  enablePhonetic: boolean;
  minWordLengthPhonetic: number;
  firstWordCost: number;
  wordOrderCost: number;
  wordDistanceCost: number;
  unmatchedWordCost: number;
  enableRelevantCategories: boolean;
  relevantCategoryDepth: number;
}

export interface SearchQuery {
  type: 'query';
  queryId: number;
  parameters: SearchQueryParameters;
}

export function applyDefaultSearchQueryParameters(localeId: string, description: string, optionalParameters: OptionalSearchQueryParameters): SearchQueryParameters {
  return {
    localeId,
    description,
    previous: optionalParameters.previous ?? [],
    limit: optionalParameters.limit ?? defaultSearchSettings.maxResults,
    rankingAlgorithm: optionalParameters.rankingAlgorithm ?? defaultSearchSettings.sortingAlgorithm,
    matchScoreWeight: optionalParameters.matchScoreWeight ?? defaultSearchSettings.matchScoreWeight,
    includeHidden: optionalParameters.includeHidden ?? false,
    limitToCategory: optionalParameters.limitToCategory ?? optionalParameters.limitToCategory,
    spellingCorrectionPreference: optionalParameters.spellingCorrectionPreference ?? defaultSearchSettings.spellingCorrectionPreference,
    minWordLength1: optionalParameters.minWordLength1 ?? defaultSearchSettings.minWordLength1,
    minWordLength2: optionalParameters.minWordLength2 ?? defaultSearchSettings.minWordLength2,
    enableEditDistance: optionalParameters.enableEditDistance ?? defaultSearchSettings.enableEditDistance,
    enablePhonetic: optionalParameters.enablePhonetic ?? defaultSearchSettings.enablePhonetic,
    minWordLengthPhonetic: optionalParameters.minWordLengthPhonetic ?? defaultSearchSettings.minWordLengthPhonetic,
    firstWordCost: optionalParameters.firstWordCost ?? defaultSearchSettings.firstWordCost,
    wordOrderCost: optionalParameters.wordOrderCost ?? defaultSearchSettings.wordOrderCost,
    wordDistanceCost: optionalParameters.wordDistanceCost ?? defaultSearchSettings.wordDistanceCost,
    unmatchedWordCost: optionalParameters.unmatchedWordCost ?? defaultSearchSettings.unmatchedWordCost,
    enableRelevantCategories: optionalParameters.enableRelevantCategories ?? defaultSearchSettings.enableRelevantCategories,
    relevantCategoryDepth: optionalParameters.relevantCategoryDepth ?? defaultSearchSettings.relevantCategoryDepth,
  };
}
