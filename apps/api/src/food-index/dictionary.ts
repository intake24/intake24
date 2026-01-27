import type { WordInterpretation } from '@intake24/api/food-index/interpreted-word';
import type { SpellingCorrectionPreference } from '@intake24/common/surveys';

import {
  AltSpelling,
  ExactMatch,
  InterpretedWord,
  Synonym,
} from '@intake24/api/food-index/interpreted-word';
import { LevenshteinTransducer } from '@intake24/api/food-index/levenshtein';

export interface SpellingCorrectionParameters {
  spellingCorrectionPreference: SpellingCorrectionPreference;
  enableEditDistance: boolean;
  minWordLength1: number;
  minWordLength2: number;
  enablePhonetic: boolean;
  minWordLengthPhonetic: number;
}

export type DictionaryType = 'foods' | 'recipes' | 'categories';

export interface PhoneticEncoder {
  encode: (input: string) => Array<string>;
}

export class RichDictionary {
  private readonly words: Set<string>;

  private readonly phoneticMap: Map<string, Set<string>> | undefined;

  private readonly synonymMap: Map<string, Set<string>>;

  private readonly phoneticEncoder: PhoneticEncoder | undefined;

  private readonly transducer: LevenshteinTransducer;

  constructor(
    words: Set<string>,
    phoneticEncoder: PhoneticEncoder | undefined,
    synSets: Array<Set<string>>,
  ) {
    this.words = new Set<string>();

    for (const word of words) this.words.add(word.toLocaleLowerCase());
    if (synSets.length > 0) {
      synSets.forEach((synSet) => {
        for (const synWord of synSet) this.words.add(synWord.toLocaleLowerCase());
      });
    }

    this.phoneticEncoder = phoneticEncoder;

    if (phoneticEncoder) {
      this.phoneticMap = new Map<string, Set<string>>();

      for (const word of this.words) {
        const encodedVariants = phoneticEncoder.encode(word);

        for (const encoded of encodedVariants) {
          let set = this.phoneticMap.get(encoded);

          if (!set)
            set = new Set<string>();

          set.add(word);

          this.phoneticMap.set(encoded, set);
        }
      }
    }

    this.transducer = new LevenshteinTransducer(words);

    this.synonymMap = new Map<string, Set<string>>();

    for (const synSet of synSets) {
      for (const word of synSet) {
        const lowerCaseWord = word.toLocaleLowerCase();

        let synList = this.synonymMap.get(lowerCaseWord);

        if (!synList)
          synList = new Set<string>();

        for (const word2 of synSet) {
          const lowerCaseWord2 = word2.toLocaleLowerCase();
          if (lowerCaseWord !== lowerCaseWord2)
            synList.add(lowerCaseWord2);
        }

        this.synonymMap.set(lowerCaseWord, synList);
      }
    }
  }

  exactMatch(lowerCaseWord: string): boolean {
    return this.words.has(lowerCaseWord);
  }

  synonyms(lowerCaseWord: string): Array<string> {
    const result = this.synonymMap.get(lowerCaseWord);
    if (!result)
      return new Array<string>();
    return [...result];
  }

  phoneticMatch(word: string): Array<string> {
    const result = new Array<string>();

    if (this.phoneticEncoder && this.phoneticMap) {
      for (const phoneticEncoding of this.phoneticEncoder.encode(word)) {
        const matchedWords = this.phoneticMap.get(phoneticEncoding);

        if (matchedWords) {
          for (const matched of matchedWords) result.push(matched);
        }
      }
    }

    return result;
  }

  interpretWord(
    word: string,
    maxInterpretations: number,
    parameters: SpellingCorrectionParameters,
  ): InterpretedWord {
    const lowerCaseWord = word.toLocaleLowerCase();
    const interpretations = new Array<WordInterpretation>();

    if (this.exactMatch(lowerCaseWord)) {
      interpretations.push(new ExactMatch(lowerCaseWord));
    }
    else {
      let phoneticMatches: WordInterpretation[] = [];

      if (parameters.enablePhonetic && lowerCaseWord.length >= parameters.minWordLengthPhonetic)
        phoneticMatches = this.phoneticMatch(lowerCaseWord).map(w => new AltSpelling(w, 'phonetic'));

      let editDistanceMatches: WordInterpretation[] = [];

      if (parameters.enableEditDistance) {
        const maxEditDistance = lowerCaseWord.length >= parameters.minWordLength2 ? 2 : lowerCaseWord.length >= parameters.minWordLength1 ? 1 : 0;
        if (maxEditDistance !== 0) {
          editDistanceMatches = this.transducer.match(lowerCaseWord, maxEditDistance).map(match => new AltSpelling(match.word, `lev${maxEditDistance}`));
        }
      }

      switch (parameters.spellingCorrectionPreference) {
        case 'phonetic':
          if (phoneticMatches.length > 0)
            interpretations.push(...phoneticMatches.slice(0, maxInterpretations));
          else
            interpretations.push(...editDistanceMatches.slice(0, maxInterpretations));
          break;
        case 'edit-distance':
          if (editDistanceMatches.length > 0)
            interpretations.push(...editDistanceMatches.slice(0, maxInterpretations));
          else
            interpretations.push(...phoneticMatches.slice(0, maxInterpretations));
          break;
        case 'both': {
          interpretations.push(...phoneticMatches.slice(0, maxInterpretations));
          interpretations.push(...editDistanceMatches.slice(0, Math.max(0, maxInterpretations - phoneticMatches.length)));
          break;
        }
      }
    }

    const synonyms: Array<string> = interpretations.flatMap(sp =>
      this.synonyms(sp.dictionaryWord),
    );

    interpretations.push(
      ...synonyms.slice(0, maxInterpretations - interpretations.length).map(s => new Synonym(s)),
    );

    return new InterpretedWord(word, interpretations);
  }
}
