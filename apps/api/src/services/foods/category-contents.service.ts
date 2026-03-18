import type { FindOptions } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';
import type { CategoryContents, CategoryHeader, CategorySearch, FoodHeader } from '@intake24/common/types/http';
import type { FoodAttributes, PaginateQuery } from '@intake24/db';

import { Op, QueryTypes } from 'sequelize';

import { NotFoundError } from '@intake24/api/http/errors';
import { Category, Food, getAllChildCategories } from '@intake24/db';

import { acceptForQuery } from './common';

function categoryContentsService({
  adminCategoryService,
  db,
  cachedParentCategoriesService,
}: Pick<IoC, 'db' | 'adminCategoryService' | 'cachedParentCategoriesService'>) {
  const filterUndefined = (
    headers: { id: string; code: string; name?: string | null; icon?: string | null }[],
  ): (CategoryHeader | FoodHeader)[] =>
    headers.filter(h => h.name).map(h => ({ id: h.id, code: h.code, name: h.name!, icon: h.icon ?? undefined }));

  const getRootCategories = async (localeCode: string): Promise<CategoryContents> => {
    const categories = await adminCategoryService.getRootCategories(localeCode);

    const catIds = categories.map(({ id }) => id);
    const categoryCache = await cachedParentCategoriesService.getCategoriesCache(catIds);
    const isRecipe = false; // Root categories are not recipes

    return {
      header: { id: '', code: '', name: 'Root' },
      foods: [],
      subcategories: categories
        .filter(({ id, hidden }) => !hidden && acceptForQuery(isRecipe, categoryCache[id]?.attributes.useInRecipes))
        .map(({ id, code, name }) => ({ id, code, name })),
    };
  };

  const getCategoryHeader = async (localeCode: string, code: string): Promise<CategoryHeader> => {
    const category = await Category.findOne({
      where: { code, localeId: localeCode },
      attributes: ['id', 'code', 'name', 'icon'],
    });

    if (!category)
      throw new NotFoundError(`Category ${code} not found`);

    return { id: category.id, code, name: category.name, icon: category.icon ?? undefined };
  };

  const getCategoryContents = async (localeCode: string, code: string): Promise<CategoryContents> => {
    const [header, categories, foods] = await Promise.all([
      getCategoryHeader(localeCode, code),
      Category.findAll({
        attributes: ['id', 'code', 'name', 'icon'],
        where: { localeId: localeCode },
        include: [
          {
            association: 'parentCategories',
            through: { attributes: [] },
            attributes: ['code'],
            where: { code },
          },
        ],
      }),
      Food.findAll({
        attributes: ['id', 'code', 'name', 'icon'],
        where: { localeId: localeCode },
        include: [
          {
            association: 'parentCategories',
            through: { attributes: [] },
            attributes: ['code'],
            where: { code },
          },
        ],
      }),
    ]);

    const foodIds = foods.map(({ id }) => id);
    const catIds = categories.map(({ id }) => id);
    const [foodCache, categoryCache] = await Promise.all([
      cachedParentCategoriesService.getFoodsCache(foodIds),
      cachedParentCategoriesService.getCategoriesCache(catIds),
    ]);
    const isRecipe = false;

    return {
      header,
      foods: filterUndefined(foods)
        .filter(({ id }) => acceptForQuery(isRecipe, foodCache[id]?.attributes.useInRecipes))
        .sort((a, b) => a.name.localeCompare(b.name)),
      subcategories: filterUndefined(categories)
        .filter(({ id }) => acceptForQuery(isRecipe, categoryCache[id]?.attributes.useInRecipes))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  };

  const searchCategory = async (localeCode: string, code: string, query: PaginateQuery): Promise<CategorySearch> => {
    const categories = await db.foods.query<{ id: string }>(getAllChildCategories, {
      type: QueryTypes.SELECT,
      replacements: { code },
      plain: false,
      raw: true,
    });

    const options: FindOptions<FoodAttributes> = {
      attributes: ['id', 'code', 'name', 'icon'],
      where: { code, localeId: localeCode },
      include: [
        {
          attributes: ['categoryId'],
          association: 'parentCategoryMappings',
          where: { categoryId: categories.map(({ id }) => id) },
        },
      ],
      order: [['name', 'ASC']],
    };
    const { search } = query;

    if (search) {
      const ops = ['englishName', 'name'].map(column => ({ [column]: { [Op.iLike]: `%${search}%` } }));
      options.where = { ...options.where, [Op.or]: ops };
    }

    return Food.paginate({
      query,
      ...options,
      transform: food => ({ id: food.id, code: food.code, name: food.name, icon: food.icon }),
    });
  };

  return {
    getCategoryContents,
    getCategoryHeader,
    getRootCategories,
    searchCategory,
  };
}

export default categoryContentsService;

export type CategoryContentsService = ReturnType<typeof categoryContentsService>;
