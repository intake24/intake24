import type { FoodBuilderTuple, PhraseWithKey } from '@intake24/api/food-index/phrase-index';

import InterpretedPhrase, { cutCombinations } from '@intake24/api/food-index/interpreted-phrase';
import { InterpretedWord } from '@intake24/api/food-index/interpreted-word';
import EnglishLanguageBackend from '@intake24/api/food-index/language-backends/en/english-language-backend';
import { PhraseIndex } from '@intake24/api/food-index/phrase-index';
import { parseSynonymSet } from '@intake24/api/food-index/synonym-sets';
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

  const synonyms: string[][] = [];
  const specialFoodsList: FoodBuilderTuple[] = [];

  const index = new PhraseIndex(
    phrases,
    EnglishLanguageBackend,
    synonyms,
    specialFoodsList,
  );

  describe('interpretation combinations', () => {
    it('empty interpretations list', () => {
      const t = new InterpretedPhrase('bleh', []);
      expect(t.generateCombinations(100)).toBeEmpty();
    });

    it('cut combinations', () => {
      const t = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
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
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
        new InterpretedWord('bleh', [
          {
            dictionaryWord: 'bleh',
            kind: 'synonym',
          },
          { dictionaryWord: 'bleh', kind: 'alt-spelling', method: 'phonetic' },
        ]),
      ]);

      const t2 = new InterpretedPhrase('bleh', [
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
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
        new InterpretedWord('bleh', [
          { dictionaryWord: 'bleh', kind: 'synonym' },
        ]),
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

      expect(t2.generateCombinations(1)).toEqual([
        [0, 0, 0],
      ]);

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

  describe('synonyms and food builders', () => {
    const spellingCorrectionParameters = {
      enableEditDistance: defaultSearchSettings.enableEditDistance,
      enablePhonetic: defaultSearchSettings.enablePhonetic,
      minWordLengthPhonetic: defaultSearchSettings.minWordLengthPhonetic,
      minWordLength1: defaultSearchSettings.minWordLength1,
      minWordLength2: defaultSearchSettings.minWordLength2,
      spellingCorrectionPreference: defaultSearchSettings.spellingCorrectionPreference,
    };

    const matchQualityParameters = {
      firstWordCost: defaultSearchSettings.firstWordCost,
      wordOrderCost: defaultSearchSettings.wordOrderCost,
      wordDistanceCost: defaultSearchSettings.wordDistanceCost,
      unmatchedWordCost: defaultSearchSettings.unmatchedWordCost,
    };

    const synonymSets: string[] = [
      'chips;fries',
      'crisps chips',
      'french fries;chips',
      'sweet potato; yam',
      'beaver tail; elephant ear; fried dough pastry',
      'hot dog frankfurter',
      ' Cool whip ; WHIPPED CREAM ',
      'ice cream; gelato',
      'the;a',
      '',
    ];

    const foods = [
      'French fries',
      'Potato chips',
      'Crisps',
      'Sweet potato',
      'Yam',
      'Beaver tail',
      'Hot dog',
      'Frankfurter',
      'Whipped cream',
      'Gelato',
    ];

    const synonymQueryCases: Array<{
      query: string;
      expectFoods: string[];
      notFoods?: string[];
    }> = [
      {
        query: 'yam',
        expectFoods: ['Yam', 'Sweet potato'],
      },
      {
        query: 'potato sweet',
        expectFoods: ['Sweet potato'],
        notFoods: ['Yam'],
      },
      {
        query: 'Fried dough pastry',
        expectFoods: ['Beaver tail'],
      },
      {
        query: 'fries',
        expectFoods: ['French fries', 'Potato chips'],
        notFoods: ['Crisps'],
      },
      {
        query: 'hot',
        expectFoods: ['Hot dog', 'Frankfurter'],
      },
      {
        query: 'Cool whip',
        expectFoods: ['Whipped cream'],
      },
      {
        query: 'cream',
        expectFoods: ['Whipped cream'],
        notFoods: ['Gelato'],
      },
      { query: 'the', expectFoods: [] },
    ];

    const foodBuilders: Array<{
      code: string;
      name: string;
      triggerWord: string | null;
      synonyms: string | null;
    }> = [
      {
        code: 'PIZZA',
        name: 'Pizza',
        triggerWord: 'pizza',
        synonyms: 'pie;',
      },
      {
        code: 'PIZZA_DUP',
        name: 'Pizza duplicate',
        triggerWord: 'pizza duplicate',
        synonyms: 'pie; flatbread pizza',
      },
      {
        code: 'PIE',
        name: 'Pie',
        triggerWord: 'pie',
        synonyms: 'tart;',
      },
      {
        code: 'TOPPING',
        name: 'Dessert topping',
        triggerWord: 'topping',
        synonyms: ' Cool whip ; WHIPPED CREAM ',
      },
      {
        code: 'ICECREAM',
        name: 'Ice cream',
        triggerWord: 'ice cream',
        synonyms: 'gelato;',
      },
      {
        code: 'STEM',
        name: 'Sandwich',
        triggerWord: 'sandwiches',
        synonyms: null,
      },
    ];

    const foodBuilderQueryCases: Array<{
      query: string;
      expectCodes: string[];
    }> = [
      {
        query: 'pizza',
        expectCodes: ['PIZZA'],
      },
      {
        query: 'pie',
        expectCodes: ['PIZZA', 'PIZZA_DUP', 'PIE'],
      },
      {
        query: 'tart',
        expectCodes: ['PIE'],
      },
      { query: 'flatbread', expectCodes: [] },
      {
        query: 'cool whip',
        expectCodes: ['TOPPING'],
      },
      {
        query: 'whipped cream',
        expectCodes: ['TOPPING'],
      },
      { query: 'cream', expectCodes: [] },
      {
        query: 'ice cream',
        expectCodes: ['ICECREAM'],
      },
      {
        query: 'gelato',
        expectCodes: ['ICECREAM'],
      },
      {
        query: 'sandwich',
        expectCodes: ['STEM'],
      },
    ];

    const foodBuilderTuples: FoodBuilderTuple[] = foodBuilders.map((foodBuilder) => {
      const name = foodBuilder.name.toLowerCase();
      return [
        name,
        {
          id: foodBuilder.code,
          code: foodBuilder.code,
          name,
          description: name,
          phrases: [
            foodBuilder.triggerWord,
            ...parseSynonymSet(foodBuilder.synonyms ?? ''),
          ]
            .map(phrase => phrase?.trim())
            .filter((phrase): phrase is string => !!phrase)
            .map(phrase => phrase.split(/\s+/)),
        },
      ];
    });

    const synonymIndex = new PhraseIndex<string>(
      foods.map((phrase, i) => ({
        phrase,
        key: phrase,
        id: String(i),
      })),
      EnglishLanguageBackend,
      [
        ...synonymSets,
      ].map(parseSynonymSet),
      foodBuilderTuples,
    );

    describe('food synonyms', () => {
      it.each(synonymQueryCases)('$query', ({ query, expectFoods, notFoods = [] }) => {
        const interpreted = synonymIndex.interpretPhrase(query, spellingCorrectionParameters, 'foods');
        const found = synonymIndex.findMatches(interpreted, 1000, matchQualityParameters).map(match => match.phrase);

        for (const food of expectFoods)
          expect(found).toContain(food);
        for (const food of notFoods)
          expect(found).not.toContain(food);
        if (expectFoods.length === 0)
          expect(found).toEqual([]);
      });
    });

    describe('food builders', () => {
      it.each(foodBuilderQueryCases)('$query', ({ query, expectCodes }) => {
        const interpreted = synonymIndex.interpretPhrase(query, spellingCorrectionParameters, 'recipes');
        const found = synonymIndex.findFoodBuilders(interpreted).map(header => header.code);

        expect([...found].sort()).toEqual([...expectCodes].sort());
      });
    });
  });
});
