import type { FoodBuilderTuple } from '../phrase-index';
import type { LocaleTranslations } from '@intake24/common/types';

import { Category, Food, FoodBuilder } from '@intake24/db';

export type FoodData = {
  id: string;
  code: string;
  englishName: string;
  name: string | null;
  altNames: LocaleTranslations;
  parentCategories: Set<string>;
};

export type CategoryData = {
  id: string;
  code: string;
  englishName: string;
  name: string;
  hidden: boolean;
  parentCategories: Set<string>;
};

// FIXME: all below requests should be limited to a constant amount of rows (paginated)

export async function fetchFoods(localeId: string): Promise<FoodData[]> {
  const foods = await Food.findAll({
    attributes: ['id', 'code', 'englishName', 'name', 'altNames'],
    where: { localeId },
    include: [
      {
        association: 'parentCategories',
        attributes: ['code'],
      },
    ],
  });

  return foods.map((row) => {
    const parentCategories = new Set(row.parentCategories!.map(row => row.code));

    return {
      id: row.id,
      code: row.code,
      englishName: row.englishName,
      name: row.name,
      altNames: row.altNames,
      parentCategories,
    };
  });
}

export async function fetchCategories(localeId: string): Promise<CategoryData[]> {
  const categories = await Category.findAll({
    where: { localeId },
    attributes: ['id', 'code', 'englishName', 'name', 'hidden'],
    include: [
      {
        association: 'parentCategories',
        attributes: ['code'],
      },
    ],
  });

  return categories.map((row) => {
    const parentCategories = new Set(row.parentCategories!.map(row => row.code));

    return ({
      id: row.id,
      code: row.code,
      englishName: row.englishName,
      name: row.name,
      hidden: row.hidden,
      parentCategories,
    });
  });
}

/**
 * Build special foods list for a given locale
 * @param {string} localeId - food Locale
 * @returns {Promise<Map<string, FoodBuilder>[]>} special foods list
 */
export async function fetchFoodBuilders(localeId: string): Promise<FoodBuilderTuple[]> {
  const foodBuilders = await FoodBuilder.findAll({
    attributes: ['id', 'code', 'name', 'triggerWord'],
    where: { localeId },
    include: [{ association: 'synonymSet', attributes: ['synonyms'] }],
  });

  return foodBuilders.map((entry: FoodBuilder) =>
    [
      entry.name.toLowerCase(),
      {
        id: entry.id,
        code: entry.code,
        name: entry.name.toLowerCase(),
        triggerWord: entry.triggerWord,
        synonyms: new Set<string>(
          entry.triggerWord
            .concat(' ', entry.synonymSet?.synonyms ?? '')
            .trim()
            .split(/\s+/),
        ),
        description: entry.name.toLocaleLowerCase(),
      },
    ],
  );
}
