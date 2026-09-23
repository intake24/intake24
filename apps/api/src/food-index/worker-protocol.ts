import type { SearchRequest } from '@intake24/api/food-index/search-query';
import type { FoodSearchResponse } from '@intake24/common/types/http';

export type LocaleBuildResult = {
  localeId: string;
  success: true;
} | {
  localeId: string;
  success: false;
  error: Error;
};

type RebuildRequest = {
  locales?: string[];
  id: number;
  type: 'rebuild';
};

type ExitRequest = { type: 'exit' };

export type WorkerRequest = SearchRequest | RebuildRequest | ExitRequest;

type InitialisingResponse = {
  type: 'initialising';
  locales: string[];
};

type ReadyResponse = {
  type: 'ready';
  results: LocaleBuildResult[];
};

/**
 * Error subclasses do not survive structured cloning across the worker boundary: they arrive as plain
 * Error instances, so failures the API has to map to a specific HTTP status are tagged explicitly.
 */
export type SearchErrorType = 'locale-not-indexed' | 'internal';

type SearchResponse = {
  type: 'search';
  id: number;
  success: true;
  results: FoodSearchResponse;
} | {
  type: 'search';
  id: number;
  success: false;
  errorType: SearchErrorType;
  error: Error;
};

type RebuildResponse = {
  type: 'rebuild';
  id: number;
  success: true;
  results: LocaleBuildResult[];
  /**
   * Locales that had food indexing enabled when this rebuild started. This is the authoritative list:
   * anything else must be treated as having no index.
   */
  enabledLocales: string[];
} | {
  type: 'rebuild';
  id: number;
  success: false;
  error: Error;
};

export type WorkerResponse
  = | InitialisingResponse
    | ReadyResponse
    | SearchResponse
    | RebuildResponse;
