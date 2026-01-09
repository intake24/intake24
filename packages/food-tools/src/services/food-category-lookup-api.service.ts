import type { ApiClientV4 } from '@intake24/api-client-v4';

export interface CodeLookupResult {
  code: string;
  type: 'food' | 'category' | 'unknown';
  exists: boolean;
  name?: string;
  lookupFailed?: boolean; // true if API call failed after retries
}

const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Service for looking up whether a code is a food or category using the API
 * This replaces hardcoded arrays with API calls
 */
export class FoodCategoryLookupApiService {
  private static instance: FoodCategoryLookupApiService;
  private apiClient: ApiClientV4;

  constructor(apiClient: ApiClientV4) {
    this.apiClient = apiClient;
  }

  static getInstance(apiClient: ApiClientV4): FoodCategoryLookupApiService {
    if (!FoodCategoryLookupApiService.instance) {
      FoodCategoryLookupApiService.instance = new FoodCategoryLookupApiService(apiClient);
    }
    return FoodCategoryLookupApiService.instance;
  }

  /**
   * Determines if a given code is a food or category by checking via the API
   * Includes retry logic with exponential backoff for transient failures
   * @param code The code to check
   * @param maxRetries Maximum number of retry attempts (default: 3)
   * @returns Information about the code including its type and existence
   */
  async lookupCode(code: string, maxRetries: number = DEFAULT_MAX_RETRIES): Promise<CodeLookupResult> {
    if (!code || typeof code !== 'string') {
      return { code, type: 'unknown', exists: false };
    }

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the new code lookup endpoint via baseClient
        const result = await this.apiClient.baseClient.get<CodeLookupResult>(`/api/admin/code-lookup/${code}`);
        return result;
      }
      catch (error: any) {
        lastError = error;

        // Don't retry on 403 (permission) or 404 (not found) - these are definitive responses
        const status = error.response?.status;
        if (status === 403) {
          console.error(`Permission denied when looking up code ${code}. Make sure the API token has 'fdbs:read' permission.`);
          return { code, type: 'unknown', exists: false, lookupFailed: true };
        }
        if (status === 404) {
          // 404 means API found but code doesn't exist - this is a valid "not found" response
          return { code, type: 'unknown', exists: false, lookupFailed: false };
        }

        // Log retry attempt for transient errors
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * RETRY_BASE_DELAY_MS; // 200ms, 400ms, 800ms
          console.warn(`Lookup failed for code ${code} (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
          await delay(delayMs);
        }
      }
    }

    // All retries exhausted
    console.error(`Failed to lookup code ${code} after ${maxRetries} attempts:`, lastError?.message || lastError);
    return {
      code,
      type: 'unknown',
      exists: false,
      lookupFailed: true,
    };
  }

  /**
   * Batch lookup for multiple codes
   * @param codes Array of codes to check
   * @param maxRetries Maximum number of retry attempts for batch and individual lookups
   * @returns Map of code to lookup result
   */
  async lookupCodes(codes: string[], maxRetries: number = DEFAULT_MAX_RETRIES): Promise<Map<string, CodeLookupResult>> {
    const results = new Map<string, CodeLookupResult>();

    if (!codes || codes.length === 0) {
      return results;
    }

    // Remove duplicates
    const uniqueCodes = [...new Set(codes)];

    let batchSuccess = false;
    let lastBatchError: any;

    // Try batch lookup with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the batch lookup endpoint via baseClient
        const batchResults = await this.apiClient.baseClient.post<Record<string, CodeLookupResult>>(
          '/api/admin/code-lookup/batch',
          { codes: uniqueCodes },
        );

        // Convert the response object to a Map
        Object.entries(batchResults).forEach(([code, result]) => {
          results.set(code, result);
        });

        batchSuccess = true;
        break;
      }
      catch (error: any) {
        lastBatchError = error;

        // Don't retry on 403 (permission error)
        if (error.response?.status === 403) {
          console.error('Permission denied for batch lookup. Make sure the API token has \'fdbs:read\' permission.');
          break;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * RETRY_BASE_DELAY_MS;
          console.warn(`Batch lookup failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
          await delay(delayMs);
        }
      }
    }

    // If batch failed, fallback to individual lookups
    if (!batchSuccess) {
      console.error('Batch lookup failed after retries, falling back to individual lookups:', lastBatchError?.message || lastBatchError);

      const lookupPromises = uniqueCodes.map(async (code) => {
        const result = await this.lookupCode(code, maxRetries);
        return { code, result };
      });

      const lookupResults = await Promise.all(lookupPromises);

      lookupResults.forEach(({ code, result }) => {
        results.set(code, result);
      });
    }

    return results;
  }

  /**
   * Check if a code exists as either a food or category
   * @param code The code to check
   * @returns True if the code exists in either table
   */
  async codeExists(code: string): Promise<boolean> {
    const result = await this.lookupCode(code);
    return result.exists;
  }

  /**
   * Get the type of a code (food, category, or unknown)
   * @param code The code to check
   * @returns The type of the code
   */
  async getCodeType(code: string): Promise<'food' | 'category' | 'unknown'> {
    const result = await this.lookupCode(code);
    return result.type;
  }
}

export default FoodCategoryLookupApiService;
