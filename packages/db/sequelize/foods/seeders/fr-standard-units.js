'use strict';

const translations = {
  anchovies: {
    estimateIn: 'anchois',
    howMany: 'Combien d\'anchois',
  },
  apricots: {
    estimateIn: 'abricots',
    howMany: 'Combien d\'abricots',
  },
  artichoke_hearts: {
    estimateIn: 'cœurs d\'artichauts',
    howMany: 'Combien de cœurs d\'artichauts',
  },
  aubergine: {
    estimateIn: 'aubergine',
    howMany: 'Combien d\'aubergines',
  },
  average_size_bags: {
    estimateIn: 'sacs de taille moyenne',
    howMany: 'Combien de sacs de taille moyenne',
  },
  average_sized_dim_sum: {
    estimateIn: 'dim sum de taille moyenne',
    howMany: 'Combien de dim sum de taille moyenne',
  },
  average_sized_flapjacks: {
    estimateIn: 'des flapjacks de taille moyenne',
    howMany: 'Combien de flapjacks de taille moyenne',
  },
  average_spring_rolls: {
    estimateIn: 'rouleaux de printemps moyens',
    howMany: 'Combien de rouleaux de printemps moyens',
  },
  average_tubs___bags: {
    estimateIn: 'moyenne bacs / sacs',
    howMany: 'Combien de bacs / sacs moyens',
  },
  bacon_and_cheese_grills: {
    estimateIn: 'grillades au bacon et au fromage',
    howMany: 'Combien de grillades au bacon et au fromage',
  },
  bagels: {
    estimateIn: 'bagels',
    howMany: 'Combien de bagels',
  },
  bags: {
    estimateIn: 'sacs',
    howMany: 'Combien de sacs',
  },
  balls: {
    estimateIn: 'boules',
    howMany: 'Combien de balles',
  },
  bars: {
    estimateIn: 'bars',
    howMany: 'Combien de barres',
  },
  batons: {
    estimateIn: 'bâtons',
    howMany: 'Combien de bâtons',
  },
  beetroot: {
    estimateIn: 'betterave',
    howMany: 'Combien de betteraves',
  },
  berries: {
    estimateIn: 'baies',
    howMany: 'Combien de baies',
  },
  biscuits: {
    estimateIn: 'biscuits',
    howMany: 'Combien de biscuits',
  },
  bites: {
    estimateIn: 'morsures',
    howMany: 'Combien de piqûres',
  },
  blocks: {
    estimateIn: 'blocs',
    howMany: 'Combien de blocs',
  },
  bunches: {
    estimateIn: 'grappes',
    howMany: 'Combien de grappes',
  },
  buns: {
    estimateIn: 'brioches',
    howMany: 'Combien de petits pains',
  },
  burgers: {
    estimateIn: 'hamburgers',
    howMany: 'Combien de hamburgers',
  },
  burritos: {
    estimateIn: 'burritos',
    howMany: 'Combien de burritos',
  },
  buttons: {
    estimateIn: 'boutons',
    howMany: 'Combien de boutons',
  },
  cakes: {
    estimateIn: 'gâteaux',
    howMany: 'Combien de gâteaux',
  },
  cannelloni_tubes: {
    estimateIn: 'tubes de cannelloni',
    howMany: 'Combien de tubes de cannelloni',
  },
  cans: {
    estimateIn: 'boîtes de conserve',
    howMany: 'Combien de boîtes',
  },
  cans_200ml: {
    estimateIn: 'Boîtes de 200 ml',
    howMany: 'Combien de boîtes de 200 ml',
  },
  cans_250ml: {
    estimateIn: 'Boîtes de 250 ml',
    howMany: 'Combien de boîtes de 250 ml',
  },
  cans_330ml: {
    estimateIn: 'Boîtes de 330 ml',
    howMany: 'Combien de boîtes de 330 ml',
  },
  cartons: {
    estimateIn: 'cartons',
    howMany: 'Combien de cartons',
  },
  cassavas: {
    estimateIn: 'cassavas',
    howMany: 'Combien de cassaves',
  },
  cherries: {
    estimateIn: 'cerises',
    howMany: 'Combien de cerises',
  },
  chestnuts: {
    estimateIn: 'châtaignes',
    howMany: 'Combien de châtaignes',
  },
  chicken_livers: {
    estimateIn: 'foies de poulet',
    howMany: 'Combien de foies de poulet',
  },
  chillies: {
    estimateIn: 'piments',
    howMany: 'Combien de piments',
  },
  chocolate_oranges: {
    estimateIn: 'oranges au chocolat',
    howMany: 'Combien d\'oranges au chocolat',
  },
  chocolates: {
    estimateIn: 'chocolats',
    howMany: 'Combien de chocolats',
  },
  chunky_fingers: {
    estimateIn: 'doigts épais',
    howMany: 'Combien de doigts trapus',
  },
  cloves: {
    estimateIn: 'clous de girofle',
    howMany: 'Combien de clous de girofle',
  },
  cocktail_sausages: {
    estimateIn: 'saucisses cocktail',
    howMany: 'Combien de saucisses cocktail',
  },
  crackers: {
    estimateIn: 'craquelins',
    howMany: 'Combien de crackers',
  },
  crepes: {
    estimateIn: 'crêpes',
    howMany: 'Combien de crêpes',
  },
  crumpets: {
    estimateIn: 'crumpets',
    howMany: 'Combien de crumpets',
  },
  cubes: {
    estimateIn: 'cubes',
    howMany: 'Combien de cubes',
  },
  cups: {
    estimateIn: 'tasses',
    howMany: 'Combien de tasses',
  },
  dates: {
    estimateIn: 'dates',
    howMany: 'Combien de dates',
  },
  dessert_spoons: {
    estimateIn: 'cuillères à dessert',
    howMany: 'Combien de cuillères à dessert',
  },
  double_measures: {
    estimateIn: 'doubles mesures',
    howMany: 'Combien de doubles mesures',
  },
  dough_balls: {
    estimateIn: 'boules de pâte',
    howMany: 'Combien de boules de pâte',
  },
  drumsticks: {
    estimateIn: 'baguettes',
    howMany: 'Combien de pilons',
  },
  dumplings: {
    estimateIn: 'boulettes',
    howMany: 'Combien de boulettes',
  },
  eggs: {
    estimateIn: 'œufs',
    howMany: 'Combien d\'œufs',
  },
  enchiladas: {
    estimateIn: 'enchiladas',
    howMany: 'Combien d\'enchiladas',
  },
  extra_large_bars: {
    estimateIn: 'barres extra larges',
    howMany: 'Combien de barres extra-larges',
  },
  extra_large_biscuits: {
    estimateIn: 'biscuits extra-larges',
    howMany: 'Combien de biscuits extra-larges',
  },
  extra_large_eggs: {
    estimateIn: 'œufs extra-larges',
    howMany: 'Combien d\'œufs extra larges',
  },
  extra_large_triangles: {
    estimateIn: 'triangles extra larges',
    howMany: 'Combien de triangles extra-larges',
  },
  fajitas: {
    estimateIn: 'fajitas',
    howMany: 'Combien de fajitas',
  },
  falafels: {
    estimateIn: 'falafels',
    howMany: 'Combien de falafels',
  },
  fatty_cutties: {
    estimateIn: 'les cutties grasses',
    howMany: 'Combien d\'animaux gras coupés',
  },
  fillets: {
    estimateIn: 'filets',
    howMany: 'Nombre de filets',
  },
  fingers: {
    estimateIn: 'doigts',
    howMany: 'Combien de doigts',
  },
  fishes: {
    estimateIn: 'poissons',
    howMany: 'Combien de poissons',
  },
  fritters: {
    estimateIn: 'beignets',
    howMany: 'Combien de beignets',
  },
  fruits: {
    estimateIn: 'fruits',
    howMany: 'Combien de fruits',
  },
  giant_buttons: {
    estimateIn: 'boutons géants',
    howMany: 'Combien de boutons géants',
  },
  giant_crumpets: {
    estimateIn: 'crumpets géants',
    howMany: 'Combien de crumpets géants',
  },
  goujons: {
    estimateIn: 'goujons',
    howMany: 'Combien de goujons',
  },
  grapes: {
    estimateIn: 'raisins',
    howMany: 'Combien de raisins',
  },
  half_pints: {
    estimateIn: 'demi-pinte',
    howMany: 'Combien de demi-pintes',
  },
  handfuls: {
    estimateIn: 'poignées',
    howMany: 'Combien de poignées',
  },
  heaped_tablespoons: {
    estimateIn: 'cuillères à soupe bombées',
    howMany: 'Combien de cuillères à soupe bombées',
  },
  heaped_teaspoons: {
    estimateIn: 'cuillères à café bombées',
    howMany: 'Combien de cuillères à café bombées',
  },
  hoppers: {
    estimateIn: 'trémies',
    howMany: 'Combien de trémies',
  },
  hot_pots: {
    estimateIn: 'marmites chaudes',
    howMany: 'Combien de pots chauds',
  },
  ice_cream_sandwiches: {
    estimateIn: 'sandwichs à la crème glacée',
    howMany: 'Combien de sandwichs à la crème glacée',
  },
  individual_packs: {
    estimateIn: 'emballages individuels',
    howMany: 'Combien d\'emballages individuels',
  },
  individual_pies: {
    estimateIn: 'tartes individuelles',
    howMany: 'Combien de tartes individuelles',
  },
  individual_pots: {
    estimateIn: 'pots individuels',
    howMany: 'Combien de pots individuels',
  },
  individual_slices: {
    estimateIn: 'tranches individuelles',
    howMany: 'Combien de tranches individuelles',
  },
  individual_tarts: {
    estimateIn: 'tartelettes individuelles',
    howMany: 'Combien de tartelettes individuelles',
  },
  items: {
    estimateIn: 'articles',
    howMany: 'Combien d\'articles',
  },
  jars: {
    estimateIn: 'pots',
    howMany: 'Combien de bocaux',
  },
  kebabs: {
    estimateIn: 'brochettes',
    howMany: 'Combien de kebabs',
  },
  kingsize_pots: {
    estimateIn: 'pots kingsize',
    howMany: 'Combien de pots kingsize',
  },
  large_aubergines: {
    estimateIn: 'grandes aubergines',
    howMany: 'Combien de grosses aubergines',
  },
  large_avocados: {
    estimateIn: 'gros avocats',
    howMany: 'Combien de grands avocats',
  },
  large_bags: {
    estimateIn: 'grands sacs',
    howMany: 'Combien de grands sacs',
  },
  large_bananas: {
    estimateIn: 'grandes bananes',
    howMany: 'Combien de grosses bananes',
  },
  large_bars: {
    estimateIn: 'grandes barres',
    howMany: 'Combien de grandes barres',
  },
  large_biscuits: {
    estimateIn: 'grands biscuits',
    howMany: 'Combien de grands biscuits',
  },
  large_bottles: {
    estimateIn: 'grandes bouteilles',
    howMany: 'Combien de grandes bouteilles',
  },
  large_bowls: {
    estimateIn: 'grands bols',
    howMany: 'Combien de grands bols',
  },
  large_burgers: {
    estimateIn: 'grands hamburgers',
    howMany: 'Combien de gros hamburgers',
  },
  large_cakes: {
    estimateIn: 'grands gâteaux',
    howMany: 'Combien de grands gâteaux',
  },
  large_carrots: {
    estimateIn: 'grosses carottes',
    howMany: 'Combien de grosses carottes',
  },
  large_cartons: {
    estimateIn: 'grands cartons',
    howMany: 'Combien de grands cartons',
  },
  large_chops: {
    estimateIn: 'grandes côtelettes',
    howMany: 'Combien de grandes côtelettes',
  },
  large_cobs: {
    estimateIn: 'gros épis',
    howMany: 'Combien de gros épis',
  },
  large_coconut_spoons: {
    estimateIn: 'grandes cuillères en noix de coco',
    howMany: 'Combien de grandes cuillères à noix de coco',
  },
  large_crackers: {
    estimateIn: 'gros crackers',
    howMany: 'Combien de grands crackers',
  },
  large_eggs: {
    estimateIn: 'gros œufs',
    howMany: 'Combien de gros œufs',
  },
  large_fillets: {
    estimateIn: 'grands filets',
    howMany: 'Combien de grands filets',
  },
  large_fingers: {
    estimateIn: 'gros doigts',
    howMany: 'Combien de gros doigts',
  },
  large_flapjacks: {
    estimateIn: 'grands flapjacks',
    howMany: 'Combien de grands flapjacks',
  },
  large_flatbreads: {
    estimateIn: 'grands pains plats',
    howMany: 'Combien de grands pains plats',
  },
  large_fruits: {
    estimateIn: 'gros fruits',
    howMany: 'Combien de gros fruits',
  },
  large_gherkins: {
    estimateIn: 'gros cornichons',
    howMany: 'Combien de gros cornichons',
  },
  large_glasses: {
    estimateIn: 'grands verres (250ml)',
    howMany: 'Combien de grands verres (250 ml)',
  },
  large_handfuls: {
    estimateIn: 'grandes poignées',
    howMany: 'Combien de grosses poignées',
  },
  large_hot_dogs: {
    estimateIn: 'grands hot-dogs',
    howMany: 'Combien de grands hot-dogs',
  },
  large_items: {
    estimateIn: 'grands articles',
    howMany: 'Combien d\'articles volumineux',
  },
  large_jars: {
    estimateIn: 'grands pots',
    howMany: 'Combien de grands pots',
  },
  large_kebabs: {
    estimateIn: 'grandes brochettes',
    howMany: 'Combien de grands kebabs',
  },
  large_kiwis: {
    estimateIn: 'gros kiwis',
    howMany: 'Combien de gros kiwis',
  },
  large_mushrooms: {
    estimateIn: 'gros champignons',
    howMany: 'Combien de gros champignons',
  },
  large_naan_breads: {
    estimateIn: 'grands pains naan',
    howMany: 'Combien de grands pains naan',
  },
  large_omelettes_4_eggs: {
    estimateIn: 'grandes omelettes (4 œufs)',
    howMany: 'Combien de grandes omelettes (4 œufs)',
  },
  large_onions: {
    estimateIn: 'gros oignons',
    howMany: 'Combien de gros oignons',
  },
  large_pancakes: {
    estimateIn: 'grandes crêpes',
    howMany: 'Combien de grandes crêpes',
  },
  large_parsnips: {
    estimateIn: 'gros panais',
    howMany: 'Combien de grands panais',
  },
  large_pastries: {
    estimateIn: 'grandes pâtisseries',
    howMany: 'Combien de grandes pâtisseries',
  },
  large_pieces: {
    estimateIn: 'gros morceaux',
    howMany: 'Combien de grandes pièces',
  },
  large_pies: {
    estimateIn: 'grandes tartes',
    howMany: 'Combien de grandes tartes',
  },
  large_plantains: {
    estimateIn: 'grandes bananes plantains',
    howMany: 'Combien de grosses bananes plantains',
  },
  large_portions: {
    estimateIn: 'de grandes portions',
    howMany: 'Combien de grandes portions',
  },
  large_pots: {
    estimateIn: 'grands pots',
    howMany: 'Combien de grands pots',
  },
  large_pouches: {
    estimateIn: 'grands sachets',
    howMany: 'Combien de grands sachets',
  },
  large_rolls: {
    estimateIn: 'gros rouleaux',
    howMany: 'Combien de grands rouleaux',
  },
  large_scones: {
    estimateIn: 'grands scones',
    howMany: 'Combien de grands scones',
  },
  large_share_bags: {
    estimateIn: 'grands sacs à provisions',
    howMany: 'Combien de grands sacs à provisions',
  },
  large_skewers: {
    estimateIn: 'grandes brochettes',
    howMany: 'Nombre de grandes brochettes',
  },
  large_slices: {
    estimateIn: 'grandes tranches',
    howMany: 'Combien de grandes tranches',
  },
  large_spring_rolls: {
    estimateIn: 'grands rouleaux de printemps',
    howMany: 'Combien de grands rouleaux de printemps',
  },
  large_squares: {
    estimateIn: 'grands carrés',
    howMany: 'Combien de grands carrés',
  },
  large_steaks: {
    estimateIn: 'gros steaks',
    howMany: 'Combien de grands steaks',
  },
  large_tarts: {
    estimateIn: 'grandes tartelettes',
    howMany: 'Combien de grandes tartelettes',
  },
  large_truffles: {
    estimateIn: 'grandes truffes',
    howMany: 'Combien de grosses truffes',
  },
  large_tubs: {
    estimateIn: 'grandes baignoires',
    howMany: 'Combien de grands bacs',
  },
  leaves: {
    estimateIn: 'feuilles',
    howMany: 'Combien de feuilles',
  },
  leeks: {
    estimateIn: 'poireaux',
    howMany: 'Combien de poireaux',
  },
  legs: {
    estimateIn: 'jambes',
    howMany: 'Combien de jambes',
  },
  medium_flatbreads: {
    estimateIn: 'pains plats moyens',
    howMany: 'Combien de pains plats moyens',
  },
  level_tablespoons: {
    estimateIn: 'cuillères à soupe rases',
    howMany: 'Combien de cuillères à soupe rases',
  },
  level_teaspoons: {
    estimateIn: 'cuillères à café rases',
    howMany: 'Combien de cuillères à café rases',
  },
  lollipops: {
    estimateIn: 'sucettes',
    howMany: 'Combien de sucettes',
  },
  macaroons: {
    estimateIn: 'macarons',
    howMany: 'Combien de macarons',
  },
  mange_tout: {
    estimateIn: 'mange tout',
    howMany: 'Combien de mange tout',
  },
  marshmallows: {
    estimateIn: 'guimauves',
    howMany: 'Combien de guimauves',
  },
  meatballs: {
    estimateIn: 'boulettes de viande',
    howMany: 'Combien de boulettes de viande',
  },
  medium_aubergines: {
    estimateIn: 'aubergines moyennes',
    howMany: 'Combien d\'aubergines moyennes',
  },
  medium_avocados: {
    estimateIn: 'avocats moyens',
    howMany: 'Combien d\'avocats moyens',
  },
  medium_bags: {
    estimateIn: 'sacs de taille moyenne',
    howMany: 'Combien de sacs moyens',
  },
  medium_bananas: {
    estimateIn: 'bananes moyennes',
    howMany: 'Combien de bananes moyennes',
  },
  medium_bars: {
    estimateIn: 'barres moyennes',
    howMany: 'Combien de barres moyennes',
  },
  medium_beetroot: {
    estimateIn: 'betterave moyenne',
    howMany: 'Combien de betteraves moyennes',
  },
  medium_biscuits: {
    estimateIn: 'biscuits moyens',
    howMany: 'Combien de biscuits moyens',
  },
  medium_bowls: {
    estimateIn: 'bols moyens',
    howMany: 'Combien de bols moyens',
  },
  medium_carrots: {
    estimateIn: 'carottes moyennes',
    howMany: 'Combien de carottes moyennes',
  },
  medium_cartons: {
    estimateIn: 'cartons moyens',
    howMany: 'Combien de cartons moyens',
  },
  medium_chops: {
    estimateIn: 'côtelettes moyennes',
    howMany: 'Combien de côtelettes moyennes',
  },
  medium_coconut_spoons: {
    estimateIn: 'cuillères moyennes en noix de coco',
    howMany: 'Combien de cuillères moyennes en noix de coco',
  },
  medium_courgettes: {
    estimateIn: 'courgettes moyennes',
    howMany: 'Combien de courgettes moyennes',
  },
  medium_eggs: {
    estimateIn: 'œufs moyens',
    howMany: 'Combien d\'œufs moyens',
  },
  medium_fillet_steaks: {
    estimateIn: 'steaks de filet moyen',
    howMany: 'Combien de steaks de filet moyens',
  },
  medium_fillets: {
    estimateIn: 'filets moyens',
    howMany: 'Combien de filets moyens',
  },
  medium_fruits: {
    estimateIn: 'fruits moyens',
    howMany: 'Combien de fruits moyens',
  },
  medium_gherkins: {
    estimateIn: 'cornichons moyens',
    howMany: 'Combien de cornichons moyens',
  },
  medium_glasses: {
    estimateIn: 'verres moyens (175 ml)',
    howMany: 'Combien de verres moyens (175 ml)',
  },
  medium_handfuls: {
    estimateIn: 'poignées moyennes',
    howMany: 'Combien de poignées moyennes',
  },
  medium_hot_dogs: {
    estimateIn: 'hot-dogs moyens',
    howMany: 'Combien de hot-dogs moyens',
  },
  medium_items: {
    estimateIn: 'éléments moyens',
    howMany: 'Combien d\'articles moyens',
  },
  medium_jars: {
    estimateIn: 'pots moyens',
    howMany: 'Combien de pots moyens',
  },
  medium_kiwis: {
    estimateIn: 'kiwis moyens',
    howMany: 'Combien de kiwis moyens',
  },
  medium_naans: {
    estimateIn: 'naans moyens',
    howMany: 'Combien de naans moyens',
  },
  medium_omelettes_2_eggs: {
    estimateIn: 'omelettes moyennes (2 œufs)',
    howMany: 'Combien d\'omelettes moyennes (2 œufs)',
  },
  medium_onions: {
    estimateIn: 'oignons moyens',
    howMany: 'Combien d\'oignons moyens',
  },
  medium_parsnips: {
    estimateIn: 'panais moyen',
    howMany: 'Combien de panais moyens',
  },
  medium_pieces: {
    estimateIn: 'pièces moyennes',
    howMany: 'Combien de pièces moyennes',
  },
  medium_plantains: {
    estimateIn: 'plantains moyens',
    howMany: 'Combien de plantains moyens',
  },
  medium_portions: {
    estimateIn: 'portions moyennes',
    howMany: 'Combien de portions moyennes',
  },
  medium_pots: {
    estimateIn: 'pots moyens',
    howMany: 'Combien de pots moyens',
  },
  medium_pouches: {
    estimateIn: 'pochettes moyennes',
    howMany: 'Combien de sachets moyens',
  },
  medium_rolls: {
    estimateIn: 'rouleaux moyens',
    howMany: 'Combien de rouleaux moyens',
  },
  medium_scones: {
    estimateIn: 'scones moyens',
    howMany: 'Combien de scones moyens',
  },
  medium_slices: {
    estimateIn: 'tranches moyennes',
    howMany: 'Combien de tranches moyennes',
  },
  medium_steaks: {
    estimateIn: 'steaks moyens',
    howMany: 'Combien de steaks moyens',
  },
  medium_sundaes: {
    estimateIn: 'sundaes moyennes',
    howMany: 'Combien de sundaes moyens',
  },
  medium_tubs: {
    estimateIn: 'bacs moyens',
    howMany: 'Combien de bacs moyens',
  },
  meringues: {
    estimateIn: 'meringues',
    howMany: 'Combien de meringues',
  },
  milles_feuilles: {
    estimateIn: 'milles feuilles',
    howMany: 'Combien de milles feuilles',
  },
  mini_baby_peppers: {
    estimateIn: 'mini/petits poivrons',
    howMany: 'Combien de mini-poivrons/petits poivrons',
  },
  mini_bars: {
    estimateIn: 'mini-bars',
    howMany: 'Combien de mini-bars',
  },
  mini_boxes: {
    estimateIn: 'mini-boîtes',
    howMany: 'Combien de mini-boîtes',
  },
  mini_churros: {
    estimateIn: 'mini churros',
    howMany: 'Combien de mini churros',
  },
  mini_cobs: {
    estimateIn: 'mini-épis',
    howMany: 'Combien de mini-épis',
  },
  mini_eclairs: {
    estimateIn: 'mini éclairs',
    howMany: 'Combien de mini-éclairs',
  },
  mini_eggs: {
    estimateIn: 'mini-œufs',
    howMany: 'Combien d\'œufs miniatures',
  },
  mini_fillets: {
    estimateIn: 'mini filets',
    howMany: 'Combien de mini-filets',
  },
  mini_flapjacks: {
    estimateIn: 'mini flapjacks',
    howMany: 'Combien de mini-flapjacks',
  },
  mini_macaroons: {
    estimateIn: 'mini macarons',
    howMany: 'Combien de mini macarons',
  },
  mini_marshmallows: {
    estimateIn: 'mini marshmallows',
    howMany: 'Combien de mini marshmallows',
  },
  mini_mozzarella_balls: {
    estimateIn: 'mini-boules de mozzarella',
    howMany: 'Combien de mini-boules de mozzarella',
  },
  mini_Oreos: {
    estimateIn: 'mini Oreos',
    howMany: 'Combien de mini Oreos',
  },
  mini_pastries: {
    estimateIn: 'mini-pâtisseries',
    howMany: 'Combien de mini-pâtisseries',
  },
  mini_pots: {
    estimateIn: 'mini-pots',
    howMany: 'Combien de mini-pots',
  },
  mini_rolls: {
    estimateIn: 'mini-rouleaux',
    howMany: 'Combien de mini-rouleaux',
  },
  mini_skewers: {
    estimateIn: 'mini-brochettes',
    howMany: 'Combien de mini-brochettes',
  },
  mini_snack_packs: {
    estimateIn: 'mini paquets de snacks',
    howMany: 'Combien de mini paquets de snacks',
  },
  mini_spring_rolls: {
    estimateIn: 'mini rouleaux de printemps',
    howMany: 'Combien de mini-rouleaux de printemps',
  },
  mini_tubs: {
    estimateIn: 'mini bacs',
    howMany: 'Combien de mini-bacs',
  },
  mints: {
    estimateIn: 'menthes',
    howMany: 'Combien de bonbons à la menthe',
  },
  mooncakes: {
    estimateIn: 'gâteaux de lune',
    howMany: 'Combien de mooncakes',
  },
  mozarella_balls: {
    estimateIn: 'boules de mozarella',
    howMany: 'Combien de boules de mozarella',
  },
  mozzarella_sticks: {
    estimateIn: 'bâtonnets de mozzarella',
    howMany: 'Combien de bâtonnets de mozzarella',
  },
  mugs: {
    estimateIn: 'tasses',
    howMany: 'Combien de mugs',
  },
  multipack_bags: {
    estimateIn: 'sacs multipack',
    howMany: 'Combien de sachets multipack',
  },
  multipack_bars: {
    estimateIn: 'barres multipack',
    howMany: 'Combien de barres multipack',
  },
  multipack_bottles: {
    estimateIn: 'bouteilles multipack',
    howMany: 'Nombre de bouteilles en multipack',
  },
  mushrooms: {
    estimateIn: 'champignons',
    howMany: 'Combien de champignons',
  },
  mussels: {
    estimateIn: 'moules',
    howMany: 'Combien de moules',
  },
  nectarines: {
    estimateIn: 'nectarines',
    howMany: 'Combien de nectarines',
  },
  new_potatoes: {
    estimateIn: 'pommes de terre nouvelles',
    howMany: 'Combien de pommes de terre nouvelles',
  },
  nuggets_dippers: {
    estimateIn: 'pépites/dippers',
    howMany: 'Combien de pépites/dippers',
  },
  nuts: {
    estimateIn: 'écrous',
    howMany: 'Combien de noix',
  },
  nuts_fruits: {
    estimateIn: 'fruits à coque/fruits',
    howMany: 'Combien de noix/fruits',
  },
  olives: {
    estimateIn: 'olives',
    howMany: 'Combien d\'olives',
  },
  one_inch_pieces: {
    estimateIn: 'Morceaux de 1 pouce',
    howMany: 'Combien de pièces de 1 pouce',
  },
  onion_rings: {
    estimateIn: 'rondelles d\'oignon',
    howMany: 'Combien de rondelles d\'oignon',
  },
  onions: {
    estimateIn: 'oignons',
    howMany: 'Combien d\'oignons',
  },
  oysters: {
    estimateIn: 'huîtres',
    howMany: 'Combien d\'huîtres',
  },
  packets: {
    estimateIn: 'paquets',
    howMany: 'Combien de paquets',
  },
  packs: {
    estimateIn: 'paquets',
    howMany: 'Combien de paquets',
  },
  pancakes: {
    estimateIn: 'crêpes',
    howMany: 'Combien de crêpes',
  },
  panna_cottas: {
    estimateIn: 'panna cottas',
    howMany: 'Combien de panna cottas',
  },
  pastries: {
    estimateIn: 'pâtisseries',
    howMany: 'Combien de pâtisseries',
  },
  peaches: {
    estimateIn: 'pêches',
    howMany: 'Combien de pêches',
  },
  peppers: {
    estimateIn: 'poivrons',
    howMany: 'Combien de poivrons',
  },
  pieces: {
    estimateIn: 'pièces',
    howMany: 'Combien de pièces',
  },
  pies: {
    estimateIn: 'tartes',
    howMany: 'Combien de tartes',
  },
  pigs_in_blankets: {
    estimateIn: 'les porcs dans les couvertures',
    howMany: 'Combien de cochons dans les couvertures',
  },
  pikelets: {
    estimateIn: 'brochets',
    howMany: 'Combien de brochets',
  },
  pilchards: {
    estimateIn: 'pilchards',
    howMany: 'Combien de pilchards',
  },
  pints: {
    estimateIn: 'pintes',
    howMany: 'Combien de pintes',
  },
  pods: {
    estimateIn: 'gousses',
    howMany: 'Combien de gousses',
  },
  poppadums: {
    estimateIn: 'poppadums',
    howMany: 'Combien de poppadums',
  },
  portions: {
    estimateIn: 'portions',
    howMany: 'Combien de portions',
  },
  potato_skins: {
    estimateIn: 'pommes de terre en croûte',
    howMany: 'Combien de pommes de terre',
  },
  potatoes: {
    estimateIn: 'pommes de terre',
    howMany: 'Combien de pommes de terre',
  },
  pots: {
    estimateIn: 'marmites',
    howMany: 'Combien de pots',
  },
  pots_slices: {
    estimateIn: 'pots/tranches',
    howMany: 'Combien de pots/tranches',
  },
  pouches: {
    estimateIn: 'pochettes',
    howMany: 'Nombre de sachets',
  },
  prawns: {
    estimateIn: 'crevettes',
    howMany: 'Combien de crevettes',
  },
  pretzels: {
    estimateIn: 'bretzels',
    howMany: 'Combien de bretzels',
  },
  profiteroles: {
    estimateIn: 'profiteroles',
    howMany: 'Combien de profiteroles',
  },
  prunes: {
    estimateIn: 'pruneaux',
    howMany: 'Combien de pruneaux',
  },
  punnets: {
    estimateIn: 'punnets',
    howMany: 'Combien de barrettes',
  },
  rashers: {
    estimateIn: 'hachis parmentier',
    howMany: 'Combien de rashers',
  },
  regular_churros: {
    estimateIn: 'churros ordinaires',
    howMany: 'Combien de churros ordinaires',
  },
  regular_standard_kebabs: {
    estimateIn: 'kebabs ordinaires / standards',
    howMany: 'Combien de kebabs réguliers / standard',
  },
  ribs: {
    estimateIn: 'côtes',
    howMany: 'Combien de côtes',
  },
  rice_cakes: {
    estimateIn: 'galettes de riz',
    howMany: 'Combien de galettes de riz',
  },
  rings: {
    estimateIn: 'anneaux',
    howMany: 'Combien d\'anneaux',
  },
  rolls: {
    estimateIn: 'rouleaux',
    howMany: 'Nombre de rouleaux',
  },
  sachets: {
    estimateIn: 'sachets',
    howMany: 'Combien de sachets',
  },
  sachets_made_up_with_milk: {
    estimateIn: 'sachets (composés de lait)',
    howMany: 'Combien de sachets (avec du lait)',
  },
  sausages: {
    estimateIn: 'saucisses',
    howMany: 'Combien de saucisses',
  },
  scallops: {
    estimateIn: 'coquilles Saint-Jacques',
    howMany: 'Combien de coquilles Saint-Jacques',
  },
  scones: {
    estimateIn: 'scones',
    howMany: 'Combien de scones',
  },
  scoops_of_powder: {
    estimateIn: 'mesures de poudre',
    howMany: 'Combien de mesures de poudre',
  },
  seeds: {
    estimateIn: 'semences',
    howMany: 'Combien de graines',
  },
  segments: {
    estimateIn: 'segments',
    howMany: 'Combien de segments',
  },
  share_bags: {
    estimateIn: 'sacs à provisions',
    howMany: 'Combien de sacs à partager',
  },
  sheets: {
    estimateIn: 'feuilles',
    howMany: 'Nombre de feuilles',
  },
  shots: {
    estimateIn: 'tirs',
    howMany: 'Nombre de tirs',
  },
  shrimps: {
    estimateIn: 'crevettes',
    howMany: 'Combien de crevettes',
  },
  single_measures: {
    estimateIn: 'mesures uniques',
    howMany: 'Combien de mesures individuelles',
  },
  six_inch_sub_rolls: {
    estimateIn: 'Petits pains de 6 pouces',
    howMany: 'Combien de petits pains de 6 pouces',
  },
  slices: {
    estimateIn: 'tranches',
    howMany: 'Combien de tranches',
  },
  slices_1_12th_of_cake: {
    estimateIn: 'tranches (1/12e du gâteau)',
    howMany: 'Combien de tranches (1/12e du gâteau)',
  },
  slices_1_4th_of_cake: {
    estimateIn: 'tranches (1/4 du gâteau)',
    howMany: 'Combien de tranches (1/4 du gâteau)',
  },
  slices_1_6th_of_cake: {
    estimateIn: 'tranches (1/6e du gâteau)',
    howMany: 'Combien de tranches (1/6e du gâteau)',
  },
  slices_1_8th_of_cake: {
    estimateIn: 'tranches (1/8e du gâteau)',
    howMany: 'Combien de tranches (1/8e du gâteau)',
  },
  slices_1_8th_of_pie: {
    estimateIn: 'tranches (1/8e de la tarte)',
    howMany: 'Combien de tranches (1/8e de tarte)',
  },
  slices_of_large_flatbread: {
    estimateIn: 'tranches de pain plat',
    howMany: 'Combien de tranches de pain plat',
  },
  small_aubergines: {
    estimateIn: 'petites aubergines',
    howMany: 'Combien de petites aubergines',
  },
  small_avocados: {
    estimateIn: 'petits avocats',
    howMany: 'Combien de petits avocats',
  },
  small_bags: {
    estimateIn: 'petits sacs',
    howMany: 'Combien de petits sacs',
  },
  small_bananas: {
    estimateIn: 'petites bananes',
    howMany: 'Combien de petites bananes',
  },
  small_bars: {
    estimateIn: 'petits bars',
    howMany: 'Combien de petits bars',
  },
  small_beetroot: {
    estimateIn: 'petite betterave',
    howMany: 'Combien de petites betteraves',
  },
  small_biscuits: {
    estimateIn: 'petits biscuits',
    howMany: 'Combien de petits biscuits',
  },
  small_bottles: {
    estimateIn: 'petites bouteilles',
    howMany: 'Combien de petites bouteilles',
  },
  small_bowls: {
    estimateIn: 'petits bols',
    howMany: 'Combien de petits bols',
  },
  small_burgers: {
    estimateIn: 'petits hamburgers',
    howMany: 'Combien de petits hamburgers',
  },
  small_cakes: {
    estimateIn: 'petits gâteaux',
    howMany: 'Combien de petits gâteaux',
  },
  small_carrots: {
    estimateIn: 'petites carottes',
    howMany: 'Combien de petites carottes',
  },
  small_cartons: {
    estimateIn: 'petits cartons',
    howMany: 'Combien de petits cartons',
  },
  small_chops: {
    estimateIn: 'petites côtelettes',
    howMany: 'Combien de petites côtelettes',
  },
  small_coconut_spoons: {
    estimateIn: 'petites cuillères en noix de coco',
    howMany: 'Combien de petites cuillères en noix de coco',
  },
  small_crepes: {
    estimateIn: 'petites crêpes',
    howMany: 'Combien de petites crêpes',
  },
  small_eggs: {
    estimateIn: 'petits œufs',
    howMany: 'Combien de petits œufs',
  },
  small_fillets: {
    estimateIn: 'petits filets',
    howMany: 'Combien de petits filets',
  },
  small_flatbreads: {
    estimateIn: 'petits pains plats',
    howMany: 'Combien de petits pains plats',
  },
  small_fruits: {
    estimateIn: 'petits fruits',
    howMany: 'Combien de petits fruits',
  },
  small_gherkins: {
    estimateIn: 'petits cornichons',
    howMany: 'Combien de petits cornichons',
  },
  small_glasses: {
    estimateIn: 'petits verres (125ml)',
    howMany: 'Combien de petits verres (125ml)',
  },
  small_handfuls: {
    estimateIn: 'petites poignées',
    howMany: 'Combien de petites poignées',
  },
  small_hot_dogs: {
    estimateIn: 'petits hot-dogs',
    howMany: 'Combien de petits hot-dogs',
  },
  small_individual_pavlovas: {
    estimateIn: 'petits pavlovas individuels',
    howMany: 'Combien de petites pavlovas individuelles',
  },
  small_individual_tubs: {
    estimateIn: 'petits bacs individuels',
    howMany: 'Combien de petits bacs individuels',
  },
  small_items: {
    estimateIn: 'petits objets',
    howMany: 'Combien de petits objets',
  },
  small_jars: {
    estimateIn: 'petits pots',
    howMany: 'Combien de petits pots',
  },
  small_kiwis: {
    estimateIn: 'petits kiwis',
    howMany: 'Combien de petits kiwis',
  },
  small_mushrooms: {
    estimateIn: 'petits champignons',
    howMany: 'Combien de petits champignons',
  },
  small_naans: {
    estimateIn: 'petits naans',
    howMany: 'Combien de petits naans',
  },
  small_omelettes_1_egg: {
    estimateIn: 'petites omelettes (1 œuf)',
    howMany: 'Combien de petites omelettes (1 œuf)',
  },
  small_onions: {
    estimateIn: 'petits oignons',
    howMany: 'Combien de petits oignons',
  },
  small_packets: {
    estimateIn: 'petits paquets',
    howMany: 'Combien de petits paquets',
  },
  small_pancakes: {
    estimateIn: 'petites crêpes',
    howMany: 'Combien de petites crêpes',
  },
  small_parsnips: {
    estimateIn: 'petits panais',
    howMany: 'Combien de petits panais',
  },
  small_pastries: {
    estimateIn: 'petites pâtisseries',
    howMany: 'Combien de petites pâtisseries',
  },
  small_pieces: {
    estimateIn: 'petits morceaux',
    howMany: 'Combien de petits morceaux',
  },
  small_pies: {
    estimateIn: 'petites tartes',
    howMany: 'Combien de petites tartes',
  },
  small_plantains: {
    estimateIn: 'petits plantains',
    howMany: 'Combien de petites bananes plantains',
  },
  straws: {
    estimateIn: 'pailles',
    howMany: 'Combien de pailles',
  },
  small_portions: {
    estimateIn: 'petites portions',
    howMany: 'Combien de petites portions',
  },
  small_pots: {
    estimateIn: 'petits pots',
    howMany: 'Combien de petits pots',
  },
  small_pouches: {
    estimateIn: 'petits sachets',
    howMany: 'Combien de petits sachets',
  },
  small_scones: {
    estimateIn: 'petits scones',
    howMany: 'Combien de petits scones',
  },
  small_slices: {
    estimateIn: 'petites tranches',
    howMany: 'Combien de petites tranches',
  },
  small_souffles: {
    estimateIn: 'petits soufflés',
    howMany: 'Combien de petits soufflés',
  },
  small_squares: {
    estimateIn: 'petits carrés',
    howMany: 'Combien de petits carrés',
  },
  small_steaks: {
    estimateIn: 'petits steaks',
    howMany: 'Combien de petits steaks',
  },
  small_sticks: {
    estimateIn: 'petits bâtons',
    howMany: 'Combien de petits bâtons',
  },
  small_sundaes: {
    estimateIn: 'petits sundaes',
    howMany: 'Combien de petits sundaes',
  },
  small_tins: {
    estimateIn: 'petites boîtes',
    howMany: 'Combien de petites boîtes',
  },
  small_truffles: {
    estimateIn: 'petites truffes',
    howMany: 'Combien de petites truffes',
  },
  small_tubs: {
    estimateIn: 'petits bacs',
    howMany: 'Combien de petits bacs',
  },
  snack_size_bars: {
    estimateIn: 'barres en format snack',
    howMany: 'Combien de barres au format snack',
  },
  spears: {
    estimateIn: 'lances',
    howMany: 'Combien de lances',
  },
  sprigs: {
    estimateIn: 'brins',
    howMany: 'Combien de brins',
  },
  sprouts: {
    estimateIn: 'germes',
    howMany: 'Combien de germes',
  },
  squares: {
    estimateIn: 'carrés',
    howMany: 'Combien de carrés',
  },
  standard_bags: {
    estimateIn: 'sacs standard',
    howMany: 'Combien de sacs standard',
  },
  standard_bars: {
    estimateIn: 'barres standard',
    howMany: 'Combien de barres standard',
  },
  standard_boxes: {
    estimateIn: 'boîtes standard',
    howMany: 'Combien de boîtes standard',
  },
  standard_packs: {
    estimateIn: 'paquets standard',
    howMany: 'Combien de paquets standard',
  },
  standard_size_bottles: {
    estimateIn: 'bouteilles de taille standard',
    howMany: 'Combien de bouteilles de taille standard',
  },
  standard_size_sticks: {
    estimateIn: 'bâtons de taille standard',
    howMany: 'Combien de bâtonnets de taille standard',
  },
  steaks: {
    estimateIn: 'steaks',
    howMany: 'Combien de steaks',
  },
  sticks: {
    estimateIn: 'bâtons',
    howMany: 'Combien de bâtons',
  },
  stuffed_peppers_half_a_pepper: {
    estimateIn: 'poivrons farcis (un demi-poivron)',
    howMany: 'Combien de poivrons farcis (un demi-poivron)',
  },
  sweets: {
    estimateIn: 'bonbons',
    howMany: 'Combien de bonbons',
  },
  tablespoons: {
    estimateIn: 'cuillères à soupe',
    howMany: 'Combien de cuillères à soupe',
  },
  tablets: {
    estimateIn: 'comprimés',
    howMany: 'Combien de comprimés',
  },
  tablets_capsules: {
    estimateIn: 'comprimés / gélules',
    howMany: 'Combien de comprimés / gélules',
  },
  takeaway_portions: {
    estimateIn: 'portions à emporter',
    howMany: 'Combien de portions à emporter',
  },
  tarts: {
    estimateIn: 'tartes',
    howMany: 'Combien de tartes',
  },
  teaspoons: {
    estimateIn: 'cuillères à café',
    howMany: 'Combien de cuillères à café',
  },
  thick_slices: {
    estimateIn: 'tranches épaisses',
    howMany: 'Combien de tranches épaisses',
  },
  thighs: {
    estimateIn: 'cuisses',
    howMany: 'Combien de cuisses',
  },
  thin_slices: {
    estimateIn: 'fines tranches',
    howMany: 'Combien de tranches fines',
  },
  tins: {
    estimateIn: 'boîtes de conserve',
    howMany: 'Combien de boîtes',
  },
  tomatoes: {
    estimateIn: 'tomates',
    howMany: 'Combien de tomates',
  },
  treble_measures: {
    estimateIn: 'mesures d\'aigus',
    howMany: 'Combien de mesures aiguës',
  },
  triangle_slices_half_a_piece_of_bread: {
    estimateIn: 'tranches de triangle (un demi-pain)',
    howMany: 'Combien de tranches de triangle (la moitié d\'un morceau de pain)',
  },
  tubes: {
    estimateIn: 'tubes',
    howMany: 'Combien de tubes',
  },
  tubs: {
    estimateIn: 'baignoires',
    howMany: 'Combien de bacs',
  },
  twelve_inch_sub_rolls: {
    estimateIn: 'Petits pains de 12 pouces',
    howMany: 'Combien de petits pains de 12 pouces',
  },
  very_thick_slices: {
    estimateIn: 'tranches très épaisses',
    howMany: 'Combien de tranches très épaisses',
  },
  vine_leaves: {
    estimateIn: 'feuilles de vigne',
    howMany: 'Combien de feuilles de vigne',
  },
  vol_au_vents: {
    estimateIn: 'vol-au-vents',
    howMany: 'Combien de vol-au-vents',
  },
  wafers: {
    estimateIn: 'gaufres',
    howMany: 'Combien de gaufrettes',
  },
  waffles: {
    estimateIn: 'gaufres',
    howMany: 'Combien de gaufres',
  },
  wedges: {
    estimateIn: 'cales',
    howMany: 'Combien de coins',
  },
  whole_cakes: {
    estimateIn: 'gâteaux entiers',
    howMany: 'Combien de gâteaux entiers',
  },
  whole_camemberts: {
    estimateIn: 'camemberts entiers',
    howMany: 'Combien de camemberts entiers',
  },
  whole_large_pies: {
    estimateIn: 'grandes tartes entières',
    howMany: 'Combien de grandes tartes entières',
  },
  whole_large_quiches: {
    estimateIn: 'grandes quiches entières',
    howMany: 'Combien de grandes quiches entières',
  },
  whole_large_tarts: {
    estimateIn: 'grandes tartelettes entières',
    howMany: 'Combien de grandes tartelettes entières',
  },
  whole_radishes: {
    estimateIn: 'radis entiers',
    howMany: 'Combien de radis entiers',
  },
  whole_rolls: {
    estimateIn: 'rouleaux entiers',
    howMany: 'Combien de rouleaux entiers',
  },
  whole_sausages: {
    estimateIn: 'saucisses entières',
    howMany: 'Combien de saucisses entières',
  },
  whole_small_quiches: {
    estimateIn: 'petites quiches entières',
    howMany: 'Combien de petites quiches entières',
  },
  whole_stuffed_peppers: {
    estimateIn: 'poivrons farcis entiers',
    howMany: 'Combien de poivrons farcis entiers',
  },
  wings: {
    estimateIn: 'ailes',
    howMany: 'Combien d\'ailes',
  },
  wraps_made_with_one_whole_tortilla: {
    estimateIn: 'les wraps composés d\'une tortilla entière',
    howMany: 'Combien de wraps réalisés avec une tortilla entière',
  },
  yams: {
    estimateIn: 'patates douces',
    howMany: 'Combien d\'ignames',
  },
  sandwiches_made_with_two_slices_of_bread: {
    estimateIn: 'sandwichs (avec DEUX tranches de pain)',
    howMany: 'Combien de sandwichs (faits avec DEUX tranches de pain)',
  },
};

function insertTranslation(id, key, jsonString) {
  const translationsObject = JSON.parse(jsonString);
  translationsObject.fr = translations[id][key];
  return JSON.stringify(translationsObject);
}

function deleteTranslation(jsonString) {
  const translationsObject = JSON.parse(jsonString);
  delete translationsObject.fr;
  return JSON.stringify(translationsObject);
}

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const records = await queryInterface.select(null, 'standard_units', { transaction });

      console.log('This might take a while...');

      // None of the bulk options seem to work, queryInterface.bulkInsert crashes with
      // ERROR: Cannot read properties of undefined (reading 'map')
      // if updateOnDuplicate option is used which should work according to the documentation

      for (const record of records) {
        await queryInterface.sequelize.query(
          `UPDATE standard_units
                                              SET estimate_in=:estimateIn,
                                                  how_many=:howMany,
                                                  updated_at=NOW()
                                              WHERE id = :id`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: {
              estimateIn: insertTranslation(record.id, 'estimateIn', record.estimate_in),
              howMany: insertTranslation(record.id, 'howMany', record.how_many),
              id: record.id,
            },
            transaction,
          },
        );
      }
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const records = await queryInterface.select(null, 'standard_units', { transaction });

      for (const record of records) {
        await queryInterface.sequelize.query(
          `UPDATE standard_units
                                              SET estimate_in=:estimateIn,
                                                  how_many=:howMany,
                                                  updated_at=NOW()
                                              WHERE id = :id`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: {
              estimateIn: deleteTranslation(record.estimate_in),
              howMany: deleteTranslation(record.how_many),
              id: record.id,
            },
            transaction,
          },
        );
      }
    }),
};
