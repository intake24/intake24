import type { RecipeFoodTuple } from '../phrase-index';
import type { AltNames } from '@intake24/common/types/http/admin';

import { Category, Food, RecipeFood } from '@intake24/db';

export type FoodData = {
  id: string;
  code: string;
  englishName: string;
  name: string | null;
  altNames: AltNames;
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
 * @returns {Promise<Map<string, RecipeFood>[]>} special foods list
 */
export async function fetchRecipeFoodsList(localeId: string): Promise<RecipeFoodTuple[]> {
  const recipeFoods = await RecipeFood.findAll({
    attributes: ['id', 'code', 'name', 'recipeWord'],
    where: { localeId },
    include: [{ association: 'synonymSet', attributes: ['synonyms'] }],
  });

  const recipeFoodsList: RecipeFoodTuple[] = [];
  recipeFoods.map((recipeFoodEntry: RecipeFood) =>
    recipeFoodsList.push([
      recipeFoodEntry.name.toLowerCase(),
      {
        id: recipeFoodEntry.id,
        code: recipeFoodEntry.code,
        name: recipeFoodEntry.name.toLowerCase(),
        recipeWord: recipeFoodEntry.recipeWord,
        synonyms: new Set<string>(
          recipeFoodEntry.recipeWord
            .concat(' ', recipeFoodEntry.synonymSet?.synonyms ?? '')
            .trim()
            .split(/\s+/),
        ),
        description: recipeFoodEntry.name.toLocaleLowerCase(),
      },
    ]),
  );
  return recipeFoodsList;
}
