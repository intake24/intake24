import type { Logger } from '@intake24/common-backend';

export interface OpenRouterConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  baseUrl: string;
  maxRequestsPerMinute: number;
  timeout: number;
}

export interface SynonymRequest {
  foodName: string;
  languageCode: string;
  existingSynonyms?: string[];
  category?: string;
  uiLanguage?: string; // Admin UI language for localized reasoning
}

export interface SynonymResult {
  suggestions: string[];
  reasoning?: string;
}

export interface RateLimitInfo {
  requestsRemaining: number;
  resetTime: Date;
}

/**
 * Map UI language codes to full language names for the LLM prompt.
 */
function getLanguageName(code: string | undefined): string {
  if (!code)
    return 'English';
  const languageMap: Record<string, string> = {
    en: 'English',
    ja: 'Japanese',
    fr: 'French',
    id: 'Indonesian',
    pt: 'Portuguese',
    ptBR: 'Brazilian Portuguese',
  };
  return languageMap[code] || languageMap[code.split('-')[0]] || 'English';
}

/**
 * Build optimized prompt for synonym generation using chain-of-thought approach.
 * Different prompts are used for Japanese vs other languages.
 */
function buildPrompt(request: SynonymRequest): { system: string; user: string } {
  const isJapanese = request.languageCode.startsWith('ja') || request.languageCode.startsWith('jp');

  const existingSynonymsNote = request.existingSynonyms?.length
    ? `\n\nExisting synonyms (DO NOT include these in your suggestions):\n${request.existingSynonyms.join(', ')}`
    : '';

  const categoryNote = request.category
    ? `\nFood category context: ${request.category}`
    : '';

  // Determine reasoning language based on UI language
  const reasoningLang = getLanguageName(request.uiLanguage);
  const reasoningNote = request.uiLanguage && request.uiLanguage !== 'en'
    ? `\n5. IMPORTANT: Write the "reasoning" field in ${reasoningLang}`
    : '';

  if (isJapanese) {
    return {
      system: `You are a Japanese food database expert specializing in linguistic variations and cultural naming conventions.

Your task is to generate alternative names/synonyms for food items to improve search discoverability in a dietary recall system.

CRITICAL RULES:
1. ONLY output valid JSON - no markdown, no explanations outside the JSON
2. Generate 5-10 unique synonyms that are genuinely different from the input
3. Never repeat the original food name or existing synonyms
4. Focus on variations that real users would type when searching${reasoningNote}

OUTPUT FORMAT (strict JSON):
{
  "suggestions": ["synonym1", "synonym2", ...],
  "reasoning": "Brief explanation of the variation types included${request.uiLanguage && request.uiLanguage !== 'en' ? ` (in ${reasoningLang})` : ''}"
}`,

      user: `Generate Japanese food synonyms for: "${request.foodName}"${categoryNote}${existingSynonymsNote}

Think step by step:
1. Script variations: Can this be written in different scripts (kanji/hiragana/katakana)?
2. Regional dialects: Are there regional names (Kansai, Kanto, etc.)?
3. Colloquial forms: What do people casually call this food?
4. Restaurant/menu names: How might this appear on menus?
5. Traditional vs modern: Are there older/newer naming conventions?
6. Abbreviations: Are there common shortened forms?
7. Loanword variations: Are there katakana versions of foreign-origin words?

Now generate the JSON output with your synonyms:`,
    };
  }

  // Generic prompt for other languages
  return {
    system: `You are a food database expert specializing in linguistic variations and naming conventions.

Your task is to generate alternative names/synonyms for food items to improve search discoverability in a dietary recall system.

CRITICAL RULES:
1. ONLY output valid JSON - no markdown, no explanations outside the JSON
2. Generate 5-10 unique synonyms that are genuinely different from the input
3. Never repeat the original food name or existing synonyms
4. Focus on variations that real users would type when searching${reasoningNote}

OUTPUT FORMAT (strict JSON):
{
  "suggestions": ["synonym1", "synonym2", ...],
  "reasoning": "Brief explanation of the variation types included${request.uiLanguage && request.uiLanguage !== 'en' ? ` (in ${reasoningLang})` : ''}"
}`,

    user: `Generate food synonyms for: "${request.foodName}" (Language: ${request.languageCode})${categoryNote}${existingSynonymsNote}

Think step by step:
1. Common abbreviations or nicknames
2. Regional or dialectal variations
3. Formal vs informal names
4. Brand names that became generic (if applicable)
5. Spelling variations
6. Related terms people might search for

Now generate the JSON output with your synonyms:`,
  };
}

/**
 * Parse LLM response, handling potential JSON extraction from markdown or text.
 */
function parseResponse(content: string): SynonymResult {
  // Try direct JSON parse first
  try {
    const result = JSON.parse(content.trim());
    if (Array.isArray(result.suggestions)) {
      return {
        suggestions: result.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim()),
        reasoning: typeof result.reasoning === 'string' ? result.reasoning : undefined,
      };
    }
  }
  catch {
    // Continue to extraction attempts
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(result.suggestions)) {
        return {
          suggestions: result.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim()),
          reasoning: typeof result.reasoning === 'string' ? result.reasoning : undefined,
        };
      }
    }
    catch {
      // Continue to next extraction attempt
    }
  }

  // Try to find JSON object anywhere in the response
  const objectMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
  if (objectMatch) {
    try {
      const result = JSON.parse(objectMatch[0]);
      if (Array.isArray(result.suggestions)) {
        return {
          suggestions: result.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim()),
          reasoning: typeof result.reasoning === 'string' ? result.reasoning : undefined,
        };
      }
    }
    catch {
      // Failed to parse
    }
  }

  // Fallback: return empty result
  return { suggestions: [], reasoning: 'Failed to parse LLM response' };
}

export default function openRouterSynonymService({
  openRouterConfig,
  logger,
}: {
  openRouterConfig: OpenRouterConfig;
  logger: Logger;
}) {
  const serviceLogger = logger.child({ service: 'OpenRouterSynonymService' });

  // Rate limiting state
  let requestCount = 0;
  let lastResetTime = new Date();

  /**
   * Check if service is properly configured and enabled
   */
  const isEnabled = (): boolean => {
    return openRouterConfig.enabled && !!openRouterConfig.apiKey;
  };

  /**
   * Get current model name (for status display)
   */
  const getModel = (): string | undefined => {
    return isEnabled() ? openRouterConfig.model : undefined;
  };

  /**
   * Check rate limits
   */
  const checkRateLimits = (): { allowed: boolean; info: RateLimitInfo } => {
    const now = new Date();
    const minutesSinceReset = (now.getTime() - lastResetTime.getTime()) / (1000 * 60);

    // Reset counter every minute
    if (minutesSinceReset >= 1) {
      requestCount = 0;
      lastResetTime = now;
    }

    const requestsRemaining = openRouterConfig.maxRequestsPerMinute - requestCount;
    const resetTime = new Date(lastResetTime.getTime() + 60 * 1000);

    return {
      allowed: requestsRemaining > 0,
      info: { requestsRemaining, resetTime },
    };
  };

  /**
   * Get current rate limit status
   */
  const getRateLimitStatus = (): RateLimitInfo => {
    const now = new Date();
    const minutesSinceReset = (now.getTime() - lastResetTime.getTime()) / (1000 * 60);

    if (minutesSinceReset >= 1) {
      return {
        requestsRemaining: openRouterConfig.maxRequestsPerMinute,
        resetTime: new Date(now.getTime() + 60 * 1000),
      };
    }

    return {
      requestsRemaining: openRouterConfig.maxRequestsPerMinute - requestCount,
      resetTime: new Date(lastResetTime.getTime() + 60 * 1000),
    };
  };

  /**
   * Generate synonym suggestions using OpenRouter LLM
   */
  const generateSynonyms = async (request: SynonymRequest): Promise<SynonymResult> => {
    if (!isEnabled()) {
      throw new Error('OpenRouter synonym service is not enabled or configured');
    }

    if (!request.foodName?.trim()) {
      throw new Error('Food name cannot be empty');
    }

    const rateLimitCheck = checkRateLimits();
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded. Requests remaining: ${rateLimitCheck.info.requestsRemaining}. `
        + `Resets at: ${rateLimitCheck.info.resetTime.toISOString()}`,
      );
    }

    const prompt = buildPrompt(request);

    serviceLogger.debug('Generating synonyms', {
      foodName: request.foodName,
      languageCode: request.languageCode,
      model: openRouterConfig.model,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), openRouterConfig.timeout);

      const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterConfig.apiKey}`,
          'HTTP-Referer': 'https://intake24.org',
          'X-Title': 'Intake24 Admin',
        },
        body: JSON.stringify({
          model: openRouterConfig.model,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update rate limit counter
      requestCount += 1;

      if (!response.ok) {
        const errorBody = await response.text();
        serviceLogger.error('OpenRouter API error', {
          status: response.status,
          body: errorBody,
        });
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenRouter response');
      }

      const result = parseResponse(content);

      // Filter out the original food name and existing synonyms
      const originalLower = request.foodName.toLowerCase().trim();
      const existingLower = new Set(
        (request.existingSynonyms ?? []).map(s => s.toLowerCase().trim()),
      );

      result.suggestions = result.suggestions.filter((s) => {
        const lower = s.toLowerCase().trim();
        return lower !== originalLower && !existingLower.has(lower);
      });

      serviceLogger.debug('Successfully generated synonyms', {
        foodName: request.foodName,
        suggestionsCount: result.suggestions.length,
      });

      return result;
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        serviceLogger.error('OpenRouter request timed out', {
          timeout: openRouterConfig.timeout,
          foodName: request.foodName,
        });
        throw new Error('OpenRouter request timed out');
      }

      serviceLogger.error('Failed to generate synonyms', {
        error,
        foodName: request.foodName,
      });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while generating synonyms');
    }
  };

  return {
    isEnabled,
    getModel,
    generateSynonyms,
    getRateLimitStatus,
  };
}

export type OpenRouterSynonymService = ReturnType<typeof openRouterSynonymService>;
