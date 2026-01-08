import { initContract } from '@ts-rest/core';
import { z } from 'zod';

// Request schema for synonym suggestions
const synonymSuggestionRequest = z.object({
  foodName: z.string().min(1, 'Food name is required'),
  languageCode: z.string().min(2, 'Language code is required'),
  existingSynonyms: z.array(z.string()).optional(),
  category: z.string().optional(),
  uiLanguage: z.string().optional(), // Admin UI language for localized reasoning
});

// Response schema for synonym suggestions
const synonymSuggestionResponse = z.object({
  enabled: z.boolean(),
  suggestions: z.array(z.string()),
  reasoning: z.string().optional(),
});

// Status response schema
const aiStatusResponse = z.object({
  synonymSuggestions: z.object({
    enabled: z.boolean(),
    model: z.string().optional(),
  }),
});

// Error response schema
const errorResponse = z.object({
  message: z.string(),
});

export const ai = initContract().router({
  status: {
    method: 'GET',
    path: '/admin/ai/status',
    responses: {
      200: aiStatusResponse,
    },
    summary: 'AI feature status',
    description: 'Check which AI features are enabled and available',
  },
  suggestSynonyms: {
    method: 'POST',
    path: '/admin/ai/synonyms/suggest',
    body: synonymSuggestionRequest,
    responses: {
      200: synonymSuggestionResponse,
      503: errorResponse,
    },
    summary: 'Suggest food synonyms',
    description: 'Generate synonym suggestions for a food name using LLM',
  },
});
