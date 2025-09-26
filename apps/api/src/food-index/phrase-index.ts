import type { InterpretedWord } from './interpreted-word';

import { uniq } from 'lodash';
import type {
  DictionaryType,
  PhoneticEncoder,
  SpellingCorrectionParameters,
} from '@intake24/api/food-index/dictionary';
import { RichDictionary } from '@intake24/api/food-index/dictionary';
import InterpretedPhrase from '@intake24/api/food-index/interpreted-phrase';

import {
  countDistanceViolations,
  countOrderViolations,
} from '@intake24/api/food-index/match-quality-helpers';
import type { RecipeFoodsHeader } from '@intake24/common/types';

const MAX_WORDS_PER_PHRASE = 10;
const MAX_WORD_INTERPRETATIONS = 4;

export interface PhraseWithKey<K> {
  phrase: string;
  id: string;
  key: K;
}

export type RecipeFoodTuple = [key: string, entry: RecipeFoodsHeader];

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

export class PhraseIndex<K> {
  readonly languageBackend: LanguageBackend;

  readonly dictionary: RichDictionary;

  readonly phraseIndex: Array<DictionaryPhrase<K>>;

  readonly wordIndex: Map<string, Array<[number, number]>>;

  readonly recipeFoodsList: RecipeFoodTuple[];

  readonly recipeFoodsDictionary: RichDictionary;

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
    let interpretedWords: Array<InterpretedWord>;
    // FIXME: Not sure if unmatched words are being completely ignored?
    //        Check that the unmatched word penalty is correctly applied
    switch (dictionaryType) {
      case 'foods':
      case 'categories':
        interpretedWords = words
          .map(w => this.dictionary.interpretWord(w, MAX_WORD_INTERPRETATIONS, spellingCorrectionParameters))
          .filter(w => w.interpretations.length > 0);
        break;
      case 'recipes':
        interpretedWords = words
          .map(w =>
            this.recipeFoodsDictionary.interpretWord(w, MAX_WORD_INTERPRETATIONS, spellingCorrectionParameters),
          )
          .filter(w => w.interpretations.length > 0);
        break;
      default:
        throw new Error(`Unknown dictionary type: ${dictionaryType}`);
    }
    return new InterpretedPhrase(phrase, interpretedWords);
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

    const firstWordPenalty = matchedWords.some(match => match.word.index === 0) ? 0 : parameters.firstWordCost;
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
    const allMatchedPhrases = phrase
      .generateCombinations(maxCombinations)
      .flatMap(c => this.matchCombination(phrase, c, matchQualityParameters));

    const matchedPhrases = filter ? allMatchedPhrases.filter(m => filter(this.phraseIndex[m.phraseIndex].key)) : allMatchedPhrases;

    if (matchedPhrases.length === 0)
      return [];

    let bestMatchWordCount = matchedPhrases[0].matchedWords.length;

    for (let i = 1; i < matchedPhrases.length; i += 1) {
      if (matchedPhrases[i].matchedWords.length > bestMatchWordCount)
        bestMatchWordCount = matchedPhrases[i].matchedWords.length;
    }

    const bestMatches = matchedPhrases.filter(m => m.matchedWords.length === bestMatchWordCount);
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
    synonymSets: Set<string>[],
    recipeFoodsSynonymsSet: Set<string>[] = [],
    recipeFoodsList: RecipeFoodTuple[] = [],
  ) {
    this.languageBackend = wordOps;
    this.phraseIndex = Array.from({ length: phrases.length });
    this.wordIndex = new Map<string, Array<[number, number]>>();
    this.recipeFoodsList = recipeFoodsList;

    const dictionaryWords = new Set<string>();

    for (let pi = 0; pi < phrases.length; pi += 1) {
      const words = this.getWordList(phrases[pi].phrase);
      this.phraseIndex[pi] = { asTyped: phrases[pi].phrase, words, key: phrases[pi].key, id: phrases[pi].id };

      for (let wi = 0; wi < words.length; wi += 1) {
        const occurrences = this.wordIndex.get(words[wi]) || new Array<[number, number]>();
        occurrences.push([pi, wi]);
        this.wordIndex.set(words[wi], occurrences);
        dictionaryWords.add(words[wi]);
      }
    }

    // V4-1016: stemming algorithm needs to be applied to synonyms, otherwise certain words
    // will fail to match, e.g. 'sausage' is converted into 'sausag' in the index by the stemming
    // function and if the synonym is entered as 'sausage' it will fail to match 'sausag' unless
    // the stemming function is applied to it.
    function stemWordSets(sets: Array<Set<string>>): Array<Set<string>> {
      return sets.map(set => new Set([...set].map(word => wordOps.stem(word))));
    }

    const stemmedSynonyms = stemWordSets(synonymSets);

    const stemmedRecipeSynonyms = stemWordSets(recipeFoodsSynonymsSet);

    // Creatinf a dictionary for Locale Indexing with all the synonym sets and dictionary words
    this.dictionary = new RichDictionary(dictionaryWords, wordOps.phoneticEncoder, stemmedSynonyms);

    // Falten Array of recipe Foods int othe Set of string
    const recipeDictionaryWords = new Set<string>();
    for (const recipeFoodSet of stemmedRecipeSynonyms) {
      for (const recipeFood of recipeFoodSet)
        recipeDictionaryWords.add(recipeFood);
    }

    // Create a dictionary for Recipe Foods Indexing with all the synonym sets and recipe foods
    this.recipeFoodsDictionary = new RichDictionary(
      recipeDictionaryWords,
      wordOps.phoneticEncoder,
      stemmedRecipeSynonyms,
    );
  }
}
