/**
 * Chinese Language Backend Exports
 *
 * This module provides enhanced Chinese language search capabilities including:
 * - Language backend with jieba segmentation
 * - Phonetic encoding with fuzzy pinyin matching
 * - Query expansion with synonyms and related terms
 * - Intent detection for nutritional and dietary queries
 * - Compound food name parsing
 */

// Compound parser
export { ChineseCompoundParser, compoundParser } from './chinese-compound-parser';
export type { FoodStructure, ParsedComponent } from './chinese-compound-parser';
// Intent detection
export { ChineseIntentDetector, intentDetector } from './chinese-intent-detector';

export type { NutritionalFilter, SearchIntent } from './chinese-intent-detector';
// Language backends
export { default as ChineseLanguageBackend } from './chinese-language-backend';
export { expandSearchQuery, getAutocompleteSuggestions } from './chinese-language-backend';

// Phonetic encoders
export { default as ChinesePhoneticEncoder } from './chinese-phonetic-encoder';
// Query expansion
export { ChineseQueryExpander, queryExpander } from './chinese-query-expander';

// Note: Search analytics, cache, and semantic search modules removed (not implemented)

// Complete integration example:
/*
import {
  ChineseLanguageBackend,
  expandSearchQuery,
  intentDetector,
  compoundParser
} from '@intake24/api/food-index/language-backends/zh';

// Enhanced search flow
async function enhancedSearch(query: string) {
  // Detect intent
  const intent = intentDetector.detectIntent(query);
  const nutritionalFilters = intentDetector.extractNutritionalFilters(query);

  // Parse compound names
  const structure = compoundParser.parse(query);
  const variations = compoundParser.generateSearchVariations(structure);

  // Expand query
  const expanded = expandSearchQuery(query);

  // Perform search with all enhancements
  const results = await performSearch([query, ...expanded, ...variations]);

  // Apply intent-based filtering
  const modifiers = intentDetector.getSearchModifiers(intent);
  const filtered = applyFilters(results, modifiers);

  return filtered;
}
*/
