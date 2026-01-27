import type { PhraseWithKey, RecipeFoodTuple } from '@intake24/api/food-index/phrase-index';

import InterpretedPhrase, { cutCombinations } from '@intake24/api/food-index/interpreted-phrase';
import { InterpretedWord } from '@intake24/api/food-index/interpreted-word';
import EnglishLanguageBackend from '@intake24/api/food-index/language-backends/en/english-language-backend';
import { PhraseIndex } from '@intake24/api/food-index/phrase-index';
import { defaultSearchSettings } from '@intake24/common/surveys';

describe('phrase index', () => {
  const phrases: Array<PhraseWithKey<string>> = [
    {
      phrase: 'banana with banana tea',
      key: 'P1',
      id: '1',
    },
    {
      phrase: 'dog helicopter with coffee rice',
      key: 'P2',
      id: '2',
    },
    {
      phrase: 'pizza and chips with strawberry jam and vodka',
      key: 'P3',
      id: '3',
    },
  ];

  const _indexFilter: Array<string> = ['with'];

  const synonyms: Array<Set<string>> = [];
  const specialFoodsSynonyms: Array<Set<string>> = [];
  const specialFoodsList: RecipeFoodTuple[] = [];

  const index = new PhraseIndex(
    phrases,
    EnglishLanguageBackend,
    synonyms,
    specialFoodsSynonyms,
    specialFoodsList,
  );

  describe('interpretation combinations', () => {
    it('empty interpretations list', () => {
      const t = new InterpretedPhrase('bleh', []);
      expect(t.generateCombinations(100)).toBeEmpty();
    });

    it('cut combinations', () => {
      const t = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
      ]);

      const cut = cutCombinations(t.words, 1);

      expect(cut[2].interpretations.length).toBe(1);
      expect(cut[2].interpretations[0].kind).toBe('alt-spelling');
    });

    it('generate combinations', () => {
      const t1 = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
      ]);

      const t2 = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
      ]);

      const t3 = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [{ dictionaryWord: 'bleh', kind: 'synonym' }]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
      ]);

      expect(t1.generateCombinations(100)).toEqual([
        [0, 0, 0],
        [0, 0, 1],
      ]);

      expect(t2.generateCombinations(100)).toEqual([
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
      ]);

      expect(t2.generateCombinations(1)).toEqual([[0, 0, 0]]);

      expect(t3.generateCombinations(2)).toEqual([
        [0, 0, 0],
        [0, 0, 1],
      ]);
    });

    it('match', () => {
      const t = index.interpretPhrase('banana with coffee', {
        enableEditDistance: defaultSearchSettings.enableEditDistance,
        enablePhonetic: defaultSearchSettings.enablePhonetic,
        minWordLengthPhonetic: defaultSearchSettings.minWordLengthPhonetic,
        minWordLength1: defaultSearchSettings.minWordLength1,
        minWordLength2: defaultSearchSettings.minWordLength2,
        spellingCorrectionPreference: defaultSearchSettings.spellingCorrectionPreference,
      });

      console.log(JSON.stringify(index.findMatches(t, 10, {
        firstWordCost: defaultSearchSettings.firstWordCost,
        wordOrderCost: defaultSearchSettings.wordOrderCost,
        wordDistanceCost: defaultSearchSettings.wordDistanceCost,
        unmatchedWordCost: defaultSearchSettings.unmatchedWordCost,
      })));
    });
  });
});
