import type { RequiredPhrase } from './interpreted-phrase';
import type {
  DictionaryType,
  PhoneticEncoder,
  SpellingCorrectionParameters,
} from '@intake24/api/food-index/dictionary';
import type { FoodBuilderHeader, FoodHeader } from '@intake24/common/types/http';

import { uniq } from 'lodash-es';

import { RichDictionary } from '@intake24/api/food-index/dictionary';
import InterpretedPhrase from '@intake24/api/food-index/interpreted-phrase';
import {
  countDistanceViolations,
  countOrderViolations,
} from '@intake24/api/food-index/match-quality-helpers';

const MAX_WORDS_PER_PHRASE = 10;
const MAX_WORD_INTERPRETATIONS = 4;
const MAX_SYNONYM_VARIANTS = 100;

export interface PhraseWithKey<K> {
  phrase: string;
  id: string;
  key: K;
}

export type FoodBuilderEntry = Omit<FoodBuilderHeader, 'synonyms'> & {
  phrases: string[][];
};

export type FoodBuilderTuple = [key: string, entry: FoodBuilderEntry];

export interface LanguageBackend {
  name: string;
  languageCode: string;
  indexIgnore: string[];
  phoneticEncoder: PhoneticEncoder | undefined;

  sanitiseDescription: (description: string) => string;
  stem: (word: string) => string;
  splitCompound: (word: string) => Array<string>;
}

export interface DictionaryPhrase<K> {
  asTyped: string;
  words: Array<string>;
  id: string;
  key: K;
}

export interface WordMatch {
  word: {
    index: number;
    interpretationIndex: number;
  };
  matched: {
    phraseIndex: number;
    wordIndex: number;
  };
}

interface PhraseMatch {
  phraseIndex: number;
  quality: number;
  matchedWords: Array<WordMatch>;
}

export interface PhraseMatchResult<K> {
  phrase: string;
  id: string;
  key: K;
  quality: number;
}

export interface MatchQualityParameters {
  firstWordCost: number;
  wordOrderCost: number;
  wordDistanceCost: number;
  unmatchedWordCost: number;
}

interface SynonymVariant {
  words: string[];
  requiredPhrases: RequiredPhrase[];
}

function containsPhrase(
  queryWords: string[],
  phrase: string[],
  candidates: Map<string, Set<string>>,
): boolean {
  for (let start = 0; start <= queryWords.length - phrase.length; start++) {
    if (phrase.every((word, offset) => candidates.get(queryWords[start + offset])?.has(word)))
      return true;
  }

  return false;
}

export class PhraseIndex<K> {
  readonly languageBackend: LanguageBackend;

  readonly dictionary: RichDictionary;

  readonly phraseIndex: Array<DictionaryPhrase<K>>;

  readonly wordIndex: Map<string, Array<[number, number]>>;

  readonly foodBuildersList: FoodBuilderTuple[];

  readonly foodBuildersDictionary: RichDictionary;

  private readonly phraseSynonymSets: string[][][];

  private readonly normalizedBuilderPhrases: string[][][];

  getWordList(phrase: string): Array<string> {
    const sanitised = this.languageBackend.sanitiseDescription(phrase.toLocaleLowerCase());

    return (
      sanitised
        .split(/\s+/)
        .filter(s => s.length > 1)
        .filter(s => !this.languageBackend.indexIgnore.includes(s))
        // split compound words (e.g. for German and Nordic languages)
        .flatMap(s => this.languageBackend.splitCompound(s))
        .map(s => this.languageBackend.stem(s))
    );
  }

  interpretPhrase(
    phrase: string,
    spellingCorrectionParameters: SpellingCorrectionParameters,
    dictionaryType: DictionaryType = 'foods',
  ): InterpretedPhrase {
    const words = this.getWordList(phrase).slice(0, MAX_WORDS_PER_PHRASE);
    // FIXME: Not sure if unmatched words are being completely ignored?
    //        Check that the unmatched word penalty is correctly applied
    let dictionary: RichDictionary;

    switch (dictionaryType) {
      case 'foods':
      case 'categories':
        dictionary = this.dictionary;
        break;
      case 'recipes':
        dictionary = this.foodBuildersDictionary;
        break;
      default:
        throw new Error(`Unknown dictionary type: ${dictionaryType}`);
    }

    const variants: SynonymVariant[] = dictionaryType === 'recipes'
      ? [
          { words, requiredPhrases: [] },
        ]
      : this.expandSynonymPhrases(words, dictionary, spellingCorrectionParameters);

    const interpretedVariants = variants.map((variant) => {
      const interpretedWords = variant.words
        .map(w => dictionary.interpretWord(w, MAX_WORD_INTERPRETATIONS, spellingCorrectionParameters))
        .filter(w => w.interpretations.length > 0);

      return new InterpretedPhrase(phrase, interpretedWords, {
        requiredPhrases: variant.requiredPhrases,
      });
    });

    const [primary = new InterpretedPhrase(phrase, []), ...synonymVariants] = interpretedVariants;
    primary.synonymVariants = synonymVariants;
    return primary;
  }

  findFoodBuilders(interpretedQuery: InterpretedPhrase): FoodHeader[] {
    const queryWords = this.getWordList(interpretedQuery.asTyped).slice(0, MAX_WORDS_PER_PHRASE);
    const candidates = new Map<string, Set<string>>();
    for (const word of interpretedQuery.words) {
      candidates.set(word.asTyped, new Set([
        word.asTyped,
        ...word.interpretations.map(interpretation => interpretation.dictionaryWord),
      ]));
    }

    const headers = new Map<string, FoodHeader>();

    this.foodBuildersList.forEach(([, entry], i) => {
      if (headers.has(entry.code))
        return;

      if (this.normalizedBuilderPhrases[i].some(phrase => containsPhrase(queryWords, phrase, candidates)))
        headers.set(entry.code, { id: entry.id, code: entry.code, name: entry.description });
    });

    return [
      ...headers.values(),
    ];
  }

  private expandSynonymPhrases(
    words: string[],
    dictionary: RichDictionary,
    spellingCorrectionParameters: SpellingCorrectionParameters,
  ): SynonymVariant[] {
    const phraseSets = this.phraseSynonymSets;
    const variants: SynonymVariant[] = [
      {
        words,
        requiredPhrases: [],
      },
    ];
    const knownVariants = new Set<string>();

    if (!phraseSets.length)
      return variants;

    const wordCandidates: Set<string>[] = words.map((w) => {
      const candidates = new Set<string>([w]);
      const interpreted = dictionary.interpretWord(w, MAX_WORD_INTERPRETATIONS, spellingCorrectionParameters);
      for (const interpretation of interpreted.interpretations)
        candidates.add(interpretation.dictionaryWord);
      return candidates;
    });

    const expand = (
      queryIndex: number,
      outputWords: string[],
      requiredMatches: RequiredPhrase[],
    ) => {
      if (variants.length >= MAX_SYNONYM_VARIANTS)
        return;
      if (queryIndex === words.length) {
        if (!requiredMatches.length)
          return;
        const key = JSON.stringify([outputWords, requiredMatches]);
        if (!knownVariants.has(key)) {
          knownVariants.add(key);
          variants.push({ words: outputWords, requiredPhrases: requiredMatches });
        }
        return;
      }

      expand(queryIndex + 1, [...outputWords, words[queryIndex]], requiredMatches);

      for (const set of phraseSets) {
        for (const source of set) {
          if (!source.every((word, offset) => wordCandidates[queryIndex + offset]?.has(word)))
            continue;
          for (const replacement of set) {
            if (source.length === replacement.length && source.every((word, offset) => word === replacement[offset]))
              continue;

            expand(
              queryIndex + source.length,
              [
                ...outputWords,
                ...replacement,
              ],
              [
                ...requiredMatches,
                {
                  words: replacement,
                },
              ],
            );
          }
        }
      }
    };

    expand(0, [], []);
    return variants;
  }

  // Avoid matching a single input word with many phrase words at once,
  // but still match the same word multiple times in correct sequence if it is
  // indeed seen several times in the input
  //
  // E.g., for the dictionary phrase "a black dog and a black cat"
  // given the input "black" we should only match "black" once
  // but for input "black black" we need to match both instances of "black"
  // and in the same order as they appear in the dictionary phrase
  //
  // Assumes that values in groupedMatches are sorted by input word index.

  private ensureUniqueMatches(
    groupedMatches: Map<number, Array<WordMatch>>,
  ): Map<number, Array<WordMatch>> {
    const result = new Map<number, Array<WordMatch>>();

    for (const key of groupedMatches.keys()) {
      const matches = groupedMatches.get(key)!;
      const uniqueMatches = new Array<WordMatch>();

      const usedInputIndices = new Set<number>();
      const usedDictionaryIndices = new Set<number>();

      for (const match of matches) {
        if (!usedInputIndices.has(match.word.index)) {
          let minDictIndex = -1;

          for (const match2 of matches) {
            if (
              match.word.index === match2.word.index
              && minDictIndex < match2.matched.wordIndex
              && !usedDictionaryIndices.has(match2.matched.wordIndex)
            ) {
              minDictIndex = match2.matched.wordIndex;
            }
          }

          if (minDictIndex !== -1) {
            uniqueMatches.push(match);
            usedInputIndices.add(match.word.index);
            usedDictionaryIndices.add(minDictIndex);
          }
        }
      }

      result.set(key, uniqueMatches);
    }

    return result;
  }

  private evaluateMatchQuality(input: InterpretedPhrase, matchedWords: Array<WordMatch>, parameters: MatchQualityParameters): number {
    const matchedIndices = matchedWords.map(w => w.matched.wordIndex);

    const firstWordPenalty = matchedWords.some(match => match.word.index === 0)
      ? 0
      : parameters.firstWordCost;
    const orderViolations = countOrderViolations(matchedIndices);
    const distanceViolations = countDistanceViolations(matchedIndices);

    const matchedWordCount = uniq(matchedWords.map(match => match.word.index)).length;
    const unmatchedWords = input.words.length - matchedWordCount;

    return (
      firstWordPenalty
      + orderViolations * parameters.wordOrderCost
      + distanceViolations * parameters.wordDistanceCost
      + unmatchedWords * parameters.unmatchedWordCost
    );
  }

  private matchCombination(
    phrase: InterpretedPhrase,
    combination: Array<number>,
    matchQualityParameters: MatchQualityParameters,
  ): Array<PhraseMatch> {
    // First step is to build a flat list of matched words from the word index, where every match is
    // a reference to a specific word in a dictionary phrase in the form of a s
    // (phrase index, word index) pair combined with the index of the word in the input phrase and
    // its interpretation index (given by the current interpretations combination).

    const wordMatches = new Array<WordMatch>();

    for (let wi = 0; wi < phrase.words.length; wi += 1) {
      const interpretationIndex = combination[wi];

      const indexMatches
        = this.wordIndex.get(phrase.words[wi].interpretations[interpretationIndex].dictionaryWord)
          || [];

      const matchedWords: Array<WordMatch> = indexMatches.map(m => ({
        word: {
          index: wi,
          interpretationIndex,
        },
        matched: {
          phraseIndex: m[0],
          wordIndex: m[1],
        },
      }));

      wordMatches.push(...matchedWords);
    }

    // Next step is to group the word matches by the phrase index so we can give each potential
    // matched phrase a match quality score

    const groupedMatches = new Map<number, Array<WordMatch>>();

    for (const match of wordMatches) {
      const { phraseIndex } = match.matched;
      const array: Array<WordMatch> = groupedMatches.get(phraseIndex) || [];
      array.push(match);
      groupedMatches.set(phraseIndex, array);
    }

    // Sort the grouped matches by the input word index so we can apply word order violation cost
    // later

    for (const key of groupedMatches.keys()) {
      // cannot be undefined because we're iterating over known keys
      const array = groupedMatches.get(key)!;
      array.sort((m1, m2) => m1.word.index - m2.word.index);
    }

    // Clean up duplicate word matches

    const uniqueGroupedMatches = this.ensureUniqueMatches(groupedMatches);

    const phraseMatches = new Array<PhraseMatch>();

    for (const key of uniqueGroupedMatches.keys()) {
      const matchedWords = uniqueGroupedMatches.get(key)!;

      const indexedWords = this.phraseIndex[key].words;
      let requiredPhrasesFound = true;
      for (const required of phrase.requiredPhrases) {
        let found = false;
        for (let start = 0; start <= indexedWords.length - required.words.length; start++) {
          if (required.words.every((word, offset) => indexedWords[start + offset] === word)) {
            found = true;
            break;
          }
        }
        if (!found) {
          requiredPhrasesFound = false;
          break;
        }
      }
      if (!requiredPhrasesFound)
        continue;

      const quality = this.evaluateMatchQuality(phrase, matchedWords, matchQualityParameters);

      phraseMatches.push({
        phraseIndex: key,
        quality,
        matchedWords,
      });
    }

    return phraseMatches;
  }

  findMatches(
    phrase: InterpretedPhrase,
    maxCombinations: number,
    matchQualityParameters: MatchQualityParameters,
    filter?: (key: K) => boolean,
  ): Array<PhraseMatchResult<K>> {
    const variants = [phrase, ...phrase.synonymVariants];
    // evenly split the combination max across variants so total is around maxCombinations
    const combinationLimit = Math.max(1, Math.floor(maxCombinations / variants.length));

    // keep highest word count matches, done per variant so synonyms don't override the original query
    const bestMatches = variants.flatMap((variant) => {
      const matches = variant
        .generateCombinations(combinationLimit)
        .flatMap(c => this.matchCombination(variant, c, matchQualityParameters));

      const accepted = filter
        ? matches.filter(m => filter(this.phraseIndex[m.phraseIndex].key))
        : matches;

      let bestWordCount = 0;
      for (const m of accepted)
        bestWordCount = Math.max(bestWordCount, m.matchedWords.length);

      return accepted.filter(m => m.matchedWords.length === bestWordCount);
    });

    if (bestMatches.length === 0)
      return [];

    bestMatches.sort((m1, m2) => m2.quality - m1.quality);

    // exclude duplicates which could have appeared due to different
    // variants of spelling correction on the same word matching
    // different words in the same phrase
    // e.g. the word "cat" is not in the dictionary and is corrected
    // to "oat" and "eat"
    // then it will match the phrase "eat oats" twice

    const knownPhrases = new Set<number>();
    const uniqueMatches: PhraseMatch[] = [];

    for (const m of bestMatches) {
      if (!knownPhrases.has(m.phraseIndex)) {
        uniqueMatches.push(m);
        knownPhrases.add(m.phraseIndex);
      }
    }

    return uniqueMatches.map(m => ({
      phrase: this.phraseIndex[m.phraseIndex].asTyped,
      id: this.phraseIndex[m.phraseIndex].id,
      key: this.phraseIndex[m.phraseIndex].key,
      quality: m.quality,
    }));
  }

  constructor(
    phrases: PhraseWithKey<K>[],
    wordOps: LanguageBackend,
    synonymSets: string[][],
    foodBuildersList: FoodBuilderTuple[] = [],
  ) {
    this.languageBackend = wordOps;
    this.phraseIndex = Array.from({ length: phrases.length });
    this.wordIndex = new Map<string, Array<[number, number]>>();
    this.foodBuildersList = foodBuildersList;
    // V4-1016: stemming algorithm needs to be applied to synonyms, otherwise certain words
    // will fail to match, e.g. 'sausage' is converted into 'sausag' in the index by the stemming
    // function and if the synonym is entered as 'sausage' it will fail to match 'sausag' unless
    // the stemming function is applied to it.

    const normalizedSynonymSets = synonymSets
      .map(set => set.map(phrase => this.getWordList(phrase)).filter(phrase => phrase.length > 0))
      .filter(set => set.length > 1);
    const singleWordSynonymSets = normalizedSynonymSets
      .filter(set => set.every(phrase => phrase.length === 1))
      .map(set => new Set(set.map(phrase => phrase[0])));
    this.phraseSynonymSets = normalizedSynonymSets.filter(set => set.some(phrase => phrase.length > 1));
    this.normalizedBuilderPhrases = foodBuildersList.map(([, entry]) =>
      entry.phrases
        .map(phrase => this.getWordList(phrase.join(' ')))
        .filter(phrase => phrase.length > 0),
    );

    const dictionaryWords = new Set<string>();

    for (let pi = 0; pi < phrases.length; pi += 1) {
      const words = this.getWordList(phrases[pi].phrase);
      this.phraseIndex[pi] = {
        asTyped: phrases[pi].phrase,
        words,
        key: phrases[pi].key,
        id: phrases[pi].id,
      };

      for (let wi = 0; wi < words.length; wi += 1) {
        const occurrences = this.wordIndex.get(words[wi]) || new Array<[number, number]>();
        occurrences.push([pi, wi]);
        this.wordIndex.set(words[wi], occurrences);
        dictionaryWords.add(words[wi]);
      }
    }

    const stemmedPhraseSynonyms = this.phraseSynonymSets.map(set => set.map(phrase => phrase.join(' ')));

    // Creating a dictionary for Locale Indexing with all the synonym sets and dictionary words
    this.dictionary = new RichDictionary(dictionaryWords, wordOps.phoneticEncoder, singleWordSynonymSets, stemmedPhraseSynonyms);

    const foodBuildersDictionaryWords = new Set(this.normalizedBuilderPhrases.flat(2));

    // Create a dictionary for Recipe Foods Indexing with all recipe foods
    // No synonym sets so individual words of a builder aren't treated as interchangeable synonyms
    // Builder phrases are instead matched in findFoodBuilders
    this.foodBuildersDictionary = new RichDictionary(
      foodBuildersDictionaryWords,
      wordOps.phoneticEncoder,
      [],
    );
  }
}
