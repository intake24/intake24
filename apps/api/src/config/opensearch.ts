export default {
  host: process.env.OPENSEARCH_HOST || 'https://localhost:9200',
  username: process.env.OPENSEARCH_USERNAME || 'admin',
  password: process.env.OPENSEARCH_PASSWORD || 'admin',
  indexPrefix: process.env.OPENSEARCH_INDEX_PREFIX || 'intake24_',
  japaneseIndex: process.env.OPENSEARCH_JAPANESE_INDEX ||
    (process.env.NODE_ENV === 'development' ? 'intake24_foods_ja_dev' : 'intake24_foods_ja'),
  batchSize: Number.parseInt(process.env.OPENSEARCH_BATCH_SIZE || '500', 10),

  // Index settings for Japanese
  japaneseIndexSettings: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      analysis: {
        char_filter: {
          // ICU NFKC_CF normalizer - normalizes full/half width, punctuation variants
          icu_nfkc_cf: {
            type: 'icu_normalizer',
            name: 'nfkc_cf',
          },
          // Note: Honorific stripping removed to preserve words like "ごはん"
          // Previously stripped お/ご prefixes but caused issues with common words
          // Manually handle katakana to hiragana conversion with mapping
          katakana_to_hiragana_mapping: {
            type: 'mapping',
            mappings: [
              // Full-width katakana to hiragana mappings
              'ア=>あ',
              'イ=>い',
              'ウ=>う',
              'エ=>え',
              'オ=>お',
              'カ=>か',
              'キ=>き',
              'ク=>く',
              'ケ=>け',
              'コ=>こ',
              'ガ=>が',
              'ギ=>ぎ',
              'グ=>ぐ',
              'ゲ=>げ',
              'ゴ=>ご',
              'サ=>さ',
              'シ=>し',
              'ス=>す',
              'セ=>せ',
              'ソ=>そ',
              'ザ=>ざ',
              'ジ=>じ',
              'ズ=>ず',
              'ゼ=>ぜ',
              'ゾ=>ぞ',
              'タ=>た',
              'チ=>ち',
              'ツ=>つ',
              'テ=>て',
              'ト=>と',
              'ダ=>だ',
              'ヂ=>ぢ',
              'ヅ=>づ',
              'デ=>で',
              'ド=>ど',
              'ナ=>な',
              'ニ=>に',
              'ヌ=>ぬ',
              'ネ=>ね',
              'ノ=>の',
              'ハ=>は',
              'ヒ=>ひ',
              'フ=>ふ',
              'ヘ=>へ',
              'ホ=>ほ',
              'バ=>ば',
              'ビ=>び',
              'ブ=>ぶ',
              'ベ=>べ',
              'ボ=>ぼ',
              'パ=>ぱ',
              'ピ=>ぴ',
              'プ=>ぷ',
              'ペ=>ぺ',
              'ポ=>ぽ',
              'マ=>ま',
              'ミ=>み',
              'ム=>む',
              'メ=>め',
              'モ=>も',
              'ヤ=>や',
              'ユ=>ゆ',
              'ヨ=>よ',
              'ラ=>ら',
              'リ=>り',
              'ル=>る',
              'レ=>れ',
              'ロ=>ろ',
              'ワ=>わ',
              'ヲ=>を',
              'ン=>ん',
              'ァ=>ぁ',
              'ィ=>ぃ',
              'ゥ=>ぅ',
              'ェ=>ぇ',
              'ォ=>ぉ',
              'ャ=>ゃ',
              'ュ=>ゅ',
              'ョ=>ょ',
              'ッ=>っ',
              'ヴ=>ゔ',
              'ヵ=>か',
              'ヶ=>け',
              // Iteration marks
              '々=>々',
              'ゝ=>ゝ',
              'ゞ=>ゞ',
              'ヽ=>ヽ',
              'ヾ=>ヾ',
            ],
          },
        },
        tokenizer: {
          kuromoji_user_dict: {
            type: 'kuromoji_tokenizer',
            mode: 'search',
            discard_punctuation: true,
          },
        },
        analyzer: {
          // Main index-time analyzer for Japanese text
          ja_search: {
            type: 'custom',
            tokenizer: 'kuromoji_user_dict',
            char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
            filter: [
              'kuromoji_baseform',
              'kuromoji_part_of_speech',
              'ja_stop',
              'kuromoji_number',
              'kuromoji_stemmer',
              'lowercase',
              'icu_folding',
            ],
          },
          // Query-time analyzer with synonyms
          ja_query: {
            type: 'custom',
            tokenizer: 'kuromoji_user_dict',
            char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
            filter: [
              'synonym_graph_filter',
              'kuromoji_baseform',
              'kuromoji_part_of_speech',
              'ja_stop',
              'kuromoji_number',
              'kuromoji_stemmer',
              'lowercase',
              'icu_folding',
            ],
          },
          // Reading analyzer: provides katakana and romaji variants
          ja_reading: {
            type: 'custom',
            tokenizer: 'kuromoji_user_dict',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'kuromoji_readingform',
              'lowercase',
              'icu_folding',
            ],
          },
          // Romaji reading for cross-script search
          ja_reading_romaji: {
            type: 'custom',
            tokenizer: 'kuromoji_user_dict',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'reading_romaji',
              'lowercase',
              'icu_folding',
            ],
          },
          // Analyzer that preserves katakana for better compound word matching
          ja_katakana: {
            type: 'custom',
            tokenizer: 'kuromoji_user_dict',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'kuromoji_baseform',
              'kuromoji_part_of_speech',
              'ja_stop',
              'kuromoji_number',
              'kuromoji_stemmer',
              'lowercase',
              'icu_folding',
            ],
          },
          // N-gram analyzer for substring matching
          ja_ngram: {
            type: 'custom',
            tokenizer: 'standard',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'lowercase',
              'edge_ngram_2_10',
            ],
          },
        },
        filter: {
          icu_folding: {
            type: 'icu_folding',
            unicodeSetFilter: '[^ぁ-ゟァ-ヿ]', // Don't fold hiragana/katakana themselves
          },
          reading_romaji: {
            type: 'kuromoji_readingform',
            use_romaji: true,
          },
          edge_ngram_2_10: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 10,
          },
          synonym_graph_filter: {
            type: 'synonym_graph',
            lenient: true,
            synonyms: [
              // Beer variations
              'ビール,ビア,麦酒,クラフトビール,地ビール,beer,craft beer',
              '発泡酒,第3のビール,第三のビール,新ジャンル',
              '黒ビール,スタウト,ダークビール',

              // Rice variations - comprehensive mappings
              '白飯,白ご飯,白ごはん,お白飯,おしろめし,white rice',
              'ご飯,ごはん,御飯,おごはん,米飯,ライス,飯,めし,メシ,ゴハン,rice',
              '米飯,ご飯,ごはん,御飯,ライス,rice',
              '玄米,げんまい,玄米ご飯,玄米ごはん',
              '赤飯,せきはん,お赤飯,おせきはん',
              '炊き込みご飯,炊き込みごはん,たきこみごはん,炊込みご飯,炊込みごはん',
              'チャーハン,炒飯,焼き飯,やきめし,焼飯,fried rice',
              'おにぎり,お握り,御握り,にぎり飯,おむすび,御結び,rice ball',

              // Soup variations
              '味噌汁,みそ汁,みそしる,お味噌汁,おみそしる,miso soup',
              'スープ,すーぷ,汁物,しるもの,soup',

              // Noodle variations
              'ラーメン,拉麺,らーめん,中華そば,中華麺,ramen',
              'うどん,饂飩,ウドン,udon',
              'そば,蕎麦,ソバ,soba',
              'パスタ,スパゲッティ,スパゲティ,pasta,spaghetti',
              '焼きそば,やきそば,ヤキソバ,yakisoba',
              'つけ麺,つけめん,ツケメン,tsukemen',

              // Sushi variations
              '寿司,すし,鮨,スシ,SUSHI,sushi',
              '刺身,さしみ,お刺身,おさしみ,sashimi',
              '巻き寿司,まきずし,巻寿司,マキズシ',
              'ちらし寿司,ちらしずし,チラシズシ,chirashi',
              'いなり寿司,いなりずし,稲荷寿司,イナリズシ',

              // Tempura variations
              '天ぷら,てんぷら,天麩羅,天婦羅,テンプラ,tempura',

              // Meat variations
              '肉,にく,ミート,お肉,おにく,meat',
              '牛肉,ぎゅうにく,ビーフ,beef',
              '豚肉,ぶたにく,ポーク,pork',
              '鶏肉,とりにく,チキン,chicken',

              // Vegetable variations
              '野菜,やさい,ベジタブル,お野菜,おやさい,vegetable',

              // Fish variations
              '魚,さかな,フィッシュ,お魚,おさかな,fish',
              '鮭,さけ,サケ,サーモン,しゃけ,salmon',
              'まぐろ,マグロ,鮪,ツナ,tuna',

              // Bread variations
              'パン,ぱん,ブレッド,食パン,しょくパン,bread',
              '白パン,しろパン,ホワイトブレッド,white bread',

              // Egg variations
              '卵,たまご,玉子,エッグ,タマゴ,egg',
              '卵焼き,玉子焼き,たまごやき,だし巻き卵,tamagoyaki',

              // Curry variations
              'カレー,かれー,カレーライス,curry',
              'カレーライス,カレー,curry rice',

              // Bento variations
              '弁当,べんとう,お弁当,おべんとう,ベントウ,bento',
              '幕の内弁当,まくのうちべんとう,幕の内,makunouchi',

              // Popular dishes
              'とんかつ,トンカツ,豚カツ,tonkatsu',
              '親子丼,おやこどん,オヤコドン,oyakodon',
              '牛丼,ぎゅうどん,ギュウドン,gyudon',
              '海鮮丼,かいせんどん,カイセンドン,kaisendon',
              'すき焼き,すきやき,スキヤキ,sukiyaki',
            ],
          },
        },
      },
    },
    mappings: {
      properties: {
        food_code: { type: 'keyword' },
        locale_id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'ja_search',
          search_analyzer: 'ja_query', // Query-time synonyms
          fields: {
            reading: {
              type: 'text',
              analyzer: 'ja_reading',
            },
            romaji: {
              type: 'text',
              analyzer: 'ja_reading_romaji',
            },
            katakana: {
              type: 'text',
              analyzer: 'ja_katakana', // Preserves katakana for compound matching
            },
            ngram: {
              type: 'text',
              analyzer: 'ja_ngram', // Edge n-gram for substring matching
              search_analyzer: 'standard',
            },
            keyword: { type: 'keyword' },
          },
        },
        description: {
          type: 'text',
          analyzer: 'ja_search',
          search_analyzer: 'ja_query',
        },
        brand_names: {
          type: 'text',
          analyzer: 'ja_search',
          search_analyzer: 'ja_query',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        categories: { type: 'keyword' },
        tags: { type: 'keyword' },
        popularity: { type: 'float' },
        ready_meal_option: { type: 'boolean' },
        same_as_before_option: { type: 'boolean' },
        reasonable_amount: { type: 'integer' },
        use_in_recipes: { type: 'integer' },
        associated_food_prompt: { type: 'keyword' },
        nutrient_table_id: { type: 'keyword' },
        nutrient_table_code: { type: 'keyword' },
        energy_kcal: { type: 'float' },
        energy_kj: { type: 'float' },
        protein: { type: 'float' },
        fat: { type: 'float' },
        carbohydrate: { type: 'float' },
        alcohol: { type: 'float' },
        sugars: { type: 'float' },
        fibre: { type: 'float' },
        sodium: { type: 'float' },
        salt: { type: 'float' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
      },
    },
  },
  // Alternative index settings using Sudachi analyzers (if available on the cluster)
  japaneseIndexSettingsSudachi: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      analysis: {
        char_filter: {
          icu_nfkc_cf: {
            type: 'icu_normalizer',
            name: 'nfkc_cf',
          },
        },
        tokenizer: {
          sudachi_tokenizer: {
            type: 'sudachi_tokenizer',
            discard_punctuation: true,
          },
        },
        analyzer: {
          ja_sudachi_index: {
            type: 'custom',
            tokenizer: 'sudachi_tokenizer',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'sudachi_baseform',
              'sudachi_split_a',
              'lowercase',
              'icu_folding',
            ],
          },
          ja_sudachi_query: {
            type: 'custom',
            tokenizer: 'sudachi_tokenizer',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'sudachi_baseform',
              'sudachi_split_a',
              'lowercase',
              'icu_folding',
              'synonym_graph_filter',
            ],
          },
          ja_sudachi_reading: {
            type: 'custom',
            tokenizer: 'sudachi_tokenizer',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'sudachi_readingform_ja',
              'lowercase',
              'icu_folding',
            ],
          },
          ja_sudachi_romaji: {
            type: 'custom',
            tokenizer: 'sudachi_tokenizer',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'sudachi_readingform_romaji',
              'lowercase',
              'icu_folding',
            ],
          },
          ja_katakana: {
            type: 'custom',
            tokenizer: 'sudachi_tokenizer',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'sudachi_baseform',
              'lowercase',
              'icu_folding',
            ],
          },
          ja_ngram: {
            type: 'custom',
            tokenizer: 'standard',
            char_filter: ['icu_nfkc_cf'],
            filter: [
              'lowercase',
              'edge_ngram_2_10',
            ],
          },
        },
        filter: {
          icu_folding: {
            type: 'icu_folding',
            unicodeSetFilter: '[^ぁ-ゟァ-ヿ]',
          },
          sudachi_split_a: {
            type: 'sudachi_split',
            mode: 'SEARCH',
          },
          sudachi_readingform_ja: {
            type: 'sudachi_readingform',
            use_romaji: false,
          },
          sudachi_readingform_romaji: {
            type: 'sudachi_readingform',
            use_romaji: true,
          },
          edge_ngram_2_10: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 10,
          },
          synonym_graph_filter: {
            type: 'synonym_graph',
            lenient: true,
            synonyms: [
              'ビール,ビア,麦酒,クラフトビール,地ビール,beer,craft beer',
              '発泡酒,第3のビール,第三のビール,新ジャンル',
              '黒ビール,スタウト,ダークビール',
              '白飯,白ご飯,白ごはん,お白飯,おしろめし,white rice',
              'ご飯,ごはん,御飯,おごはん,米飯,ライス,飯,めし,メシ,ゴハン,rice',
              '米飯,ご飯,ごはん,御飯,ライス,rice',
              '玄米,げんまい,玄米ご飯,玄米ごはん',
              '赤飯,せきはん,お赤飯,おせきはん',
              '炊き込みご飯,炊き込みごはん,たきこみごはん,炊込みご飯,炊込みごはん',
              'チャーハン,炒飯,焼き飯,やきめし,焼飯,fried rice',
              'おにぎり,お握り,御握り,にぎり飯,おむすび,御結び,rice ball',
              '味噌汁,みそ汁,みそしる,お味噌汁,おみそしる,miso soup',
              'スープ,すーぷ,汁物,しるもの,soup',
              'ラーメン,拉麺,らーめん,中華そば,中華麺,ramen',
              'うどん,饂飩,ウドン,udon',
              'そば,蕎麦,ソバ,soba',
              'パスタ,スパゲッティ,スパゲティ,pasta,spaghetti',
              '焼きそば,やきそば,ヤキソバ,yakisoba',
              'つけ麺,つけめん,ツケメン,tsukemen',
              '寿司,すし,鮨,スシ,SUSHI,sushi',
              '刺身,さしみ,お刺身,おさしみ,sashimi',
              '巻き寿司,まきずし,巻寿司,マキズシ',
              'ちらし寿司,ちらしずし,チラシズシ,chirashi',
              'いなり寿司,いなりずし,稲荷寿司,イナリズシ',
              '天ぷら,てんぷら,天麩羅,天婦羅,テンプラ,tempura',
              '肉,にく,ミート,お肉,おにく,meat',
              '牛肉,ぎゅうにく,ビーフ,beef',
              '豚肉,ぶたにく,ポーク,pork',
              '鶏肉,とりにく,チキン,chicken',
              '野菜,やさい,ベジタブル,お野菜,おやさい,vegetable',
              '魚,さかな,フィッシュ,お魚,おさかな,fish',
              '鮭,さけ,サケ,サーモン,しゃけ,salmon',
              'まぐろ,マグロ,鮪,ツナ,tuna',
              'パン,ぱん,ブレッド,食パン,しょくパン,bread',
              '白パン,しろパン,ホワイトブレッド,white bread',
              '卵,たまご,玉子,エッグ,タマゴ,egg',
              '卵焼き,玉子焼き,たまごやき,だし巻き卵,tamagoyaki',
              'カレー,かれー,カレーライス,curry',
              'カレーライス,カレー,curry rice',
              '弁当,べんとう,お弁当,おべんとう,ベントウ,bento',
              '幕の内弁当,まくのうちべんとう,幕の内,makunouchi',
              'とんかつ,トンカツ,豚カツ,tonkatsu',
              '親子丼,おやこどん,オヤコドン,oyakodon',
              '牛丼,ぎゅうどん,ギュウドン,gyudon',
              '海鮮丼,かいせんどん,カイセンドン,kaisendon',
              'すき焼き,すきやき,スキヤキ,sukiyaki',
            ],
          },
        },
      },
    },
    mappings: {
      properties: {
        food_code: { type: 'keyword' },
        locale_id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'ja_sudachi_index',
          search_analyzer: 'ja_sudachi_query',
          fields: {
            reading: {
              type: 'text',
              analyzer: 'ja_sudachi_reading',
            },
            romaji: {
              type: 'text',
              analyzer: 'ja_sudachi_romaji',
            },
            katakana: {
              type: 'text',
              analyzer: 'ja_katakana',
            },
            ngram: {
              type: 'text',
              analyzer: 'ja_ngram',
              search_analyzer: 'standard',
            },
            keyword: { type: 'keyword' },
          },
        },
        description: {
          type: 'text',
          analyzer: 'ja_sudachi_index',
          search_analyzer: 'ja_sudachi_query',
        },
        brand_names: {
          type: 'text',
          analyzer: 'ja_sudachi_index',
          search_analyzer: 'ja_sudachi_query',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        categories: { type: 'keyword' },
        tags: { type: 'keyword' },
        popularity: { type: 'float' },
        ready_meal_option: { type: 'boolean' },
        same_as_before_option: { type: 'boolean' },
        reasonable_amount: { type: 'integer' },
        use_in_recipes: { type: 'integer' },
        associated_food_prompt: { type: 'keyword' },
        nutrient_table_id: { type: 'keyword' },
        nutrient_table_code: { type: 'keyword' },
        energy_kcal: { type: 'float' },
        energy_kj: { type: 'float' },
        protein: { type: 'float' },
        fat: { type: 'float' },
        carbohydrate: { type: 'float' },
        alcohol: { type: 'float' },
        sugars: { type: 'float' },
        fibre: { type: 'float' },
        sodium: { type: 'float' },
        salt: { type: 'float' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
      },
    },
  },
};
