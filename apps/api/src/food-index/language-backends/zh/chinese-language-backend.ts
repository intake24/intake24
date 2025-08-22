import nodejieba from 'nodejieba';
import type { LanguageBackend } from '@intake24/api/food-index/phrase-index';

import ChinesePhoneticEncoder from './chinese-phonetic-encoder';
import { queryExpander } from './chinese-query-expander';

// Includes both Chinese and English punctuation
const sanitiseRegexp = /[。，、·.`,/\\+()（）「」『』【】〈〉《》〔〕［］｛｝！？：；"'…—～－-]|等等|之类|什么的|以及其他/g;

let jiebaInitialized = false;

function initializeJieba() {
  if (!jiebaInitialized) {
    try {
      nodejieba.load();
      jiebaInitialized = true;
    }
    catch {
      jiebaInitialized = false;
    }
  }
}

/**
 * Production-ready Chinese word segmentation using nodejieba
 */
function segmentChineseText(text: string): string[] {
  if (!jiebaInitialized) {
    initializeJieba();
  }

  // Use jieba for proper Chinese word segmentation
  if (jiebaInitialized) {
    try {
      const segments = nodejieba.cut(text, true);
      return segments;
    }
    catch {
      return basicSegmentation(text);
    }
  }
  return basicSegmentation(text);
}

/**
 * Basic fallback segmentation
 */
function basicSegmentation(text: string): string[] {
  const segments = text.split(/[\s，。！？；：、]+/).filter(s => s.length > 0);

  // For short segments, also include individual characters
  const result: string[] = [];
  segments.forEach((segment) => {
    result.push(segment);
    if (segment.length <= 4 && segment.length > 1) {
      for (const char of segment) {
        if (isChinese(char)) {
          result.push(char);
        }
      }
    }
  });

  return [...new Set(result)];
}

/**
 * Check if a character is Chinese
 */
function isChinese(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4DBF) || // CJK Extension A
    (code >= 0x20000 && code <= 0x2A6DF) // CJK Extension B
  );
}

/**
 * Extract keywords using TF-IDF
 */
function extractKeywords(text: string, topK: number = 5): string[] {
  if (!jiebaInitialized) {
    initializeJieba();
  }

  if (jiebaInitialized) {
    try {
      // Use jieba's TF-IDF to extract keywords
      const keywords = nodejieba.extract(text, topK);
      return keywords.map(kw => kw.word);
    }
    catch {
      return segmentChineseText(text).slice(0, topK);
    }
  }

  return segmentChineseText(text).slice(0, topK);
}

/**
 * Get part-of-speech tags for better filtering
 */
function getWordTags(text: string): Array<{ word: string; tag: string }> {
  if (!jiebaInitialized) {
    initializeJieba();
  }

  if (jiebaInitialized) {
    try {
      // Use jieba's part-of-speech tagging
      const tagged = nodejieba.tag(text);
      return tagged.map(item => ({ word: item.word, tag: item.tag }));
    }
    catch {
      return segmentChineseText(text).map(word => ({ word, tag: 'n' }));
    }
  }

  return segmentChineseText(text).map(word => ({ word, tag: 'n' }));
}

// Extracted to avoid using `this` inside object methods (noImplicitThis)
const chineseIndexIgnore = [
  // Common Chinese particles and function words
  '的',
  '了',
  '是',
  '在',
  '和',
  '与',
  '或',
  '但',
  '而',
  '把',
  '被',
  '给',
  '对',
  '向',
  '从',
  '到',
  '为',
  '因',
  '所以',
  '如果',
  '虽然',
  '因为',
  '这',
  '那',
  '这个',
  '那个',
  '一个',
  '一些',
  '很',
  '非常',
  '比较',
  '最',
  '更',
  '太',
  '就',
  '都',
  '也',
  '还',
  '又',
  '再',
  '已经',
  '正在',
  // Common measure words that don't add meaning in search
  '个',
  '只',
  '条',
  '块',
  '片',
  '份',
  '碗',
  '盘',
  '杯',
  '瓶',
  '罐',
];

const chineseLanguageBackend = {
  name: 'Chinese',
  languageCode: 'zh',
  indexIgnore: chineseIndexIgnore,
  phoneticEncoder: new ChinesePhoneticEncoder(),

  splitCompound(word: string): Array<string> {
    const compounds: string[] = [word];

    // Use jieba to segment compound words
    if (word.length >= 2) {
      const segments = segmentChineseText(word);
      // Only add segments that are different from the original word
      segments.forEach((seg) => {
        if (seg !== word && seg.length > 0) {
          compounds.push(seg);
        }
      });
    }

    // Extract keywords for longer phrases
    if (word.length >= 4) {
      const keywords = extractKeywords(word, 3);
      keywords.forEach((kw) => {
        if (!compounds.includes(kw)) {
          compounds.push(kw);
        }
      });
    }

    // Handle number + measure word patterns
    const measurePattern = /^[一二三四五六七八九十百千万\d]+([个只条块片斤两克升碗盘杯]|毫升)(.+)/;
    const match = word.match(measurePattern);
    if (match && match[2]) {
      compounds.push(match[2]);
    }

    return [...new Set(compounds)];
  },

  stem(word: string): string {
    const suffixPatterns = [
      { pattern: /儿$/, replacement: '' }, // 儿化音
      { pattern: /子$/, replacement: '' }, // 子 suffix
      { pattern: /们$/, replacement: '' }, // Plural marker
      { pattern: /类$/, replacement: '' }, // Category suffix
      { pattern: /等$/, replacement: '' }, // etc. suffix
    ];

    let stemmed = word;
    for (const { pattern, replacement } of suffixPatterns) {
      const newStem = stemmed.replace(pattern, replacement);
      // Only apply if the result is still meaningful (at least 1 character)
      if (newStem.length > 0) {
        stemmed = newStem;
      }
    }

    return stemmed;
  },

  sanitiseDescription(description: string): string {
    let sanitised = description.replace(sanitiseRegexp, ' ');
    sanitised = sanitised.replace(/\s+/g, ' ').trim();

    const segments = segmentChineseText(sanitised);

    const tagged = getWordTags(sanitised);
    const filteredSegments: string[] = [];

    const processedWords = new Set<string>();

    tagged.forEach(({ word, tag }) => {
      // Skip if already processed
      if (processedWords.has(word))
        return;
      processedWords.add(word);

      // Filter out particles and function words based on POS tags
      // Keep nouns (n), verbs (v), adjectives (a), and food-related terms
      if (tag.startsWith('n') || tag.startsWith('v') || tag.startsWith('a') ||
        tag === 'nz' || tag === 'nr' || // proper nouns
        tag === 'vn' || // verb-noun
        word.length >= 2) { // Keep multi-character terms
        // Skip if it's in the ignore list
        if (!chineseIndexIgnore.includes(word)) {
          filteredSegments.push(word);
        }
      }
    });

    if (filteredSegments.length === 0 && segments.length > 0) {
      return segments.filter(seg => !chineseIndexIgnore.includes(seg)).join(' ');
    }

    return filteredSegments.join(' ');
  },
} satisfies LanguageBackend;

/**
 * Expand search query with synonyms and related terms
 * This is an optional enhancement for Chinese language search
 */
export function expandSearchQuery(query: string, options?: {
  includeSynonyms?: boolean;
  includeRelated?: boolean;
  includeCategories?: boolean;
  maxExpansions?: number;
}): string[] {
  try {
    // First segment the query using jieba if available
    const segmented = segmentChineseText(query);

    // Expand each segment and the full query
    const allExpansions = new Set<string>([query]);

    // Expand the full query
    const fullQueryExpansions = queryExpander.expandQuery(query, options);
    fullQueryExpansions.forEach(exp => allExpansions.add(exp));

    // Expand individual segments
    segmented.forEach((segment) => {
      const segmentExpansions = queryExpander.expandQuery(segment, {
        ...options,
        maxExpansions: 5, // Limit per-segment expansions
      });
      segmentExpansions.forEach(exp => allExpansions.add(exp));
    });

    // Limit total expansions
    const maxTotal = options?.maxExpansions || 10;
    return Array.from(allExpansions).slice(0, maxTotal);
  }
  catch {
    // Query expansion failed, return original query
    return [query];
  }
}

/**
 * Get autocomplete suggestions for partial queries
 */
export function getAutocompleteSuggestions(partialQuery: string, limit = 5): string[] {
  try {
    return queryExpander.getAutocompleteSuggestions(partialQuery, limit);
  }
  catch {
    // Autocomplete suggestions failed, return empty array
    return [];
  }
}

// Initialize jieba on module load
initializeJieba();

export default chineseLanguageBackend;
