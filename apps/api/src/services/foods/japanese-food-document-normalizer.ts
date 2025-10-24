import { generateJapaneseOrthographicVariants, getHiraganaReading, normalizeJapaneseText, toKatakana, toRomaji } from '@intake24/api/utils/japanese-normalizer';
import generatedSynonyms from '../../../../../data/japanese/generated_synonyms.json';

type GeneratedSynonymGroup = {
  foodCode: string;
  canonical: string;
  terms: string[];
};

const generatedSynonymGroups = generatedSynonyms as GeneratedSynonymGroup[];
const synonymLookup = new Map<string, GeneratedSynonymGroup>(
  generatedSynonymGroups.map(group => [group.foodCode, group]),
);

export interface JapaneseFoodDocument {
  name?: string;
  name_normalized?: string;
  name_hiragana?: string;
  name_katakana?: string;
  name_variants?: string[];
  brand_names?: string[];
  [key: string]: any;
}

export async function normalizeJapaneseFoodDocument(food: JapaneseFoodDocument): Promise<JapaneseFoodDocument> {
  const hasName = typeof food.name === 'string' && food.name.length > 0;
  const nameValue = hasName ? food.name as string : undefined;
  const foodCode = typeof food.food_code === 'string' && food.food_code.length > 0
    ? food.food_code as string
    : (typeof (food as any).foodCode === 'string' ? (food as any).foodCode : undefined);

  const nameNormalized = hasName ? normalizeJapaneseText(nameValue!) : undefined;
  const nameHiragana = hasName ? await getHiraganaReading(nameValue!) : undefined;
  const katakanaSource = nameHiragana && nameHiragana.length > 0 ? nameHiragana : nameNormalized;
  const nameKatakana = hasName && katakanaSource ? toKatakana(katakanaSource) : undefined;
  const romajiSource = nameHiragana && nameHiragana.length > 0 ? nameHiragana : nameNormalized;
  const nameRomaji = hasName && romajiSource ? toRomaji(romajiSource) : undefined;

  const hasBrandNames = Array.isArray(food.brand_names);
  const normalizedBrandNames = hasBrandNames
    ? (food.brand_names as string[]).map(item => normalizeJapaneseText(item)).filter(Boolean)
    : undefined;

  const nameVariants = hasName
    ? await generateJapaneseOrthographicVariants(nameValue!, 48)
    : undefined;
  const synonymGroup = foodCode ? synonymLookup.get(foodCode) : undefined;
  const synonymCandidates = synonymGroup
    ? [synonymGroup.canonical, ...synonymGroup.terms]
    : [];
  const normalizedSynonymsRaw = synonymCandidates
    .flatMap((term) => {
      const normalized = normalizeJapaneseText(term);
      const outputs = new Set<string>();
      if (term)
        outputs.add(term);
      if (normalized)
        outputs.add(normalized);
      return Array.from(outputs);
    })
    .filter(Boolean);

  let synonymList = normalizedSynonymsRaw.length > 0
    ? Array.from(new Set(normalizedSynonymsRaw))
    : undefined;

  if (synonymList) {
    const romajiSynonyms = synonymList
      .map(value => toRomaji(value))
      .filter(romaji => !!romaji && !synonymList!.includes(romaji));

    if (romajiSynonyms.length > 0)
      synonymList = Array.from(new Set([...synonymList, ...romajiSynonyms]));
  }

  const variantSet = new Set<string>();
  if (nameVariants) {
    nameVariants.filter(Boolean).forEach(value => variantSet.add(value));
  }
  if (synonymList)
    synonymList.forEach(value => variantSet.add(value));
  if (nameRomaji)
    variantSet.add(nameRomaji);

  const uniqueVariants = variantSet.size > 0 ? Array.from(variantSet) : undefined;

  return {
    ...food,
    ...(hasName ? { name: nameValue } : {}),
    ...(hasName && nameNormalized ? { name_normalized: nameNormalized } : {}),
    ...(hasName && nameHiragana ? { name_hiragana: nameHiragana } : {}),
    ...(hasName && nameKatakana ? { name_katakana: nameKatakana } : {}),
    ...(hasName && nameRomaji ? { name_romaji: nameRomaji } : {}),
    ...(hasBrandNames ? { brand_names: normalizedBrandNames } : {}),
    ...(synonymList && synonymList.length > 0 ? { name_synonyms: synonymList } : {}),
    ...(uniqueVariants && uniqueVariants.length > 0 ? { name_variants: uniqueVariants } : {}),
  };
}
