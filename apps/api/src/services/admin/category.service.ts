import { randomUUID } from 'node:crypto';
import { pick } from 'lodash';
import { NotFoundError } from '@intake24/api/http/errors';
import { categoryResponse } from '@intake24/api/http/responses/admin';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type {
  CategoryCopyInput,
  CategoryInput,
  CategoryListEntry,
} from '@intake24/common/types/http/admin';
import type {
  CategoryAttributes,
  FindOptions,
  PaginateQuery,
  Transaction,
} from '@intake24/db';
import {
  Category,
  CategoryAttribute,
  CategoryPortionSizeMethod,
  Op,
  QueryTypes,
} from '@intake24/db';

function adminCategoryService({ cache, db, kyselyDb }: Pick<IoC, 'cache' | 'db' | 'kyselyDb'>) {
  const browseCategories = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<CategoryAttributes> = { where: { localeId } };
    const { search } = query;

    if (search) {
      const op
        = Category.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['code', 'englishName', 'name'].map(column => ({ [column]: op }));

      options.where = { ...options.where, [Op.or]: ops };
    }

    return Category.paginate({
      query,
      transform: categoryResponse,
      ...options,
    });
  };

  const browseMainCategories = async (query: PaginateQuery) => {
    const options: FindOptions<CategoryAttributes> = {};
    const { search } = query;

    if (search) {
      const op
        = Category.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['code', 'name'].map(column => ({ [column]: op }));

      options.where = { ...options.where, [Op.or]: ops };
    }

    return Category.paginate({ query, ...options });
  };

  const getRootCategories = async (localeId: string) => {
    // TODO: verify for other dialects
    const query = `SELECT DISTINCT
      c.id, c.locale_id as "localeId", c.code, c.english_name as "englishName", c.name, c.hidden
      FROM categories c
      LEFT JOIN categories_categories cc ON c.id = cc.sub_category_id
      WHERE NOT EXISTS (
        SELECT * from categories_categories cc2 JOIN categories c2 ON cc2.category_id = c2.id
        WHERE c2.hidden = :hidden AND cc2.sub_category_id = c.id
      )
      AND c.locale_id = :localeId
      ORDER BY c.name`;

    return db.foods.query<CategoryListEntry>(query, {
      type: QueryTypes.SELECT,
      replacements: { localeId, hidden: false },
    });

    /* const categories = await Category.findAll({
      attributes: ['code', 'description', 'hidden'],
      include: [
        { association: 'subcategoryMappings', attributes: [] },
        {
          association: 'locals',
          attributes: ['name'],
          where: { localeId },
          required: false,
        },
      ],
      order: [['locals', 'name', 'ASC']],
      where: Sequelize.literal(`NOT EXISTS (SELECT cc2.category_code
          FROM categories_categories cc2 JOIN categories c2 ON cc2.category_code = c2.code
          WHERE c2.is_hidden = False AND cc2.subcategory_code = Category.code)`),
    }); */
  };

  const getCategoryContents = async (localeId: string, categoryId: string) => {
    const [categories, foods] = await Promise.all([
      kyselyDb.foods
        .selectFrom('categories')
        .select([
          'id',
          'code',
          'localeId',
          'name',
          'englishName',
          'hidden',
        ])
        .where('localeId', '=', localeId)
        .innerJoin('categoriesCategories', 'categories.id', 'categoriesCategories.subCategoryId')
        .where('categoriesCategories.categoryId', '=', categoryId)
        .orderBy('name')
        .execute(),
      kyselyDb.foods
        .selectFrom('foods')
        .select([
          'id',
          'code',
          'localeId',
          'name',
          'englishName',
        ])
        .where('localeId', '=', localeId)
        .innerJoin('foodsCategories', 'foods.id', 'foodsCategories.foodId')
        .where('foodsCategories.categoryId', '=', categoryId)
        .orderBy('name')
        .execute(),
    ]);

    return { categories, foods };
  };

  const getNoCategoryContents = async (localeId: string) =>
    kyselyDb.foods
      .selectFrom('foods')
      .select([
        'id',
        'code',
        'localeId',
        'name',
        'englishName',
      ])
      .where('localeId', '=', localeId)
      .leftJoin('foodsCategories', 'foods.id', 'foodsCategories.foodId')
      .where('foodsCategories.categoryId', 'is', null)
      .orderBy('name')
      .execute();

  const getCategory = async (categoryId: { id: string; localeId?: string } | { code: string; localeId: string }) => {
    return Category.findOne({
      where: { ...categoryId },
      include: [
        {
          association: 'parentCategories',
          through: { attributes: [] },
        },
        {
          association: 'portionSizeMethods',
          separate: true,
          order: [['orderBy', 'ASC']],
        },
      ],
    });
  };

  const updatePortionSizeMethods = async (
    categoryId: string,
    methods: CategoryPortionSizeMethod[],
    inputs: CategoryInput['portionSizeMethods'],
    { transaction }: { transaction: Transaction },
  ) => {
    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await CategoryPortionSizeMethod.destroy({
      where: { categoryId, id: { [Op.notIn]: ids } },
      transaction,
    });

    if (!inputs.length)
      return [];

    const newMethods: CategoryPortionSizeMethod[] = [];

    for (const input of inputs) {
      const { id, ...rest } = input;

      if (id) {
        const match = methods.find(method => method.id === id);
        if (match) {
          await match.update(rest, { transaction });
          continue;
        }
      }

      const newMethod = await CategoryPortionSizeMethod.create(
        { ...rest, categoryId },
        { transaction },
      );
      newMethods.push(newMethod);
    }

    return [...methods, ...newMethods];
  };

  const createCategory = async (localeId: string, input: CategoryInput) => {
    const category = await db.foods.transaction(async (transaction) => {
      const category = await Category.create(
        {
          code: input.code,
          localeId,
          englishName: input.englishName,
          name: input.name,
          simpleName: toSimpleName(input.name)!,
          hidden: input.hidden,
          version: randomUUID(),
        },
        { transaction },
      );

      if (input.parentCategories?.length) {
        const categories = input.parentCategories.map(({ id }) => id);
        await category.$set('parentCategories', categories, { transaction });
      }

      return category;
    });

    return (await getCategory({ id: category.id, localeId }))!;
  };

  const updateCategory = async (localeId: string, categoryId: string, input: CategoryInput) => {
    const category = await getCategory({ id: categoryId, localeId });
    if (!category)
      throw new NotFoundError();

    const { attributes, portionSizeMethods } = category;
    if (!portionSizeMethods)
      throw new NotFoundError();

    await db.foods.transaction(async (transaction) => {
      const promises: Promise<any>[] = [
        category.update({
          ...pick(input, ['code', 'englishName', 'name', 'simpleName', 'hidden', 'tags']),
          simpleName: toSimpleName(input.name)!,
          version: randomUUID(),
        }, { transaction }),
        updatePortionSizeMethods(categoryId, portionSizeMethods, input.portionSizeMethods, { transaction }),
      ];

      if (input.parentCategories) {
        const categories = (input.parentCategories).map(({ id }) => id);
        promises.push(category.$set('parentCategories', categories, { transaction }));
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).every(item => item === null)) {
          if (attributes)
            promises.push(attributes.destroy({ transaction }));
        }
        else {
          promises.push(
            attributes
              ? attributes.update(attributesInput, { transaction })
              : CategoryAttribute.create({ categoryId, ...attributesInput }, { transaction }),
          );
        }
      }

      await Promise.all(promises);
    });

    await cache.forget([
      `category-all-categories:${categoryId}`,
      `category-all-category-codes:${category.localeId}:${category.id}`,
      `category-parent-categories:${categoryId}`,
    ]);

    return (await getCategory({ id: categoryId, localeId }))!;
  };

  const copyCategory = async (localeId: string, categoryId: string, input: CategoryCopyInput) => {
    const sourceCategory = await getCategory({ id: categoryId, localeId });
    if (!sourceCategory)
      throw new NotFoundError();

    const category = await db.foods.transaction(async (transaction) => {
      const category = await Category.create(
        {
          ...pick(sourceCategory, ['code', 'localeId', 'englishName', 'name', 'simpleName', 'hidden', 'tags']),
          ...input,
          simpleName: toSimpleName(input.name)!,
          version: randomUUID(),
        },
        { transaction },
      );

      const promises: Promise<any>[] = [];

      if (sourceCategory?.attributes) {
        promises.push(
          CategoryAttribute.create(
            {
              ...pick(sourceCategory.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']),
              categoryId: category.id,
            },
            { transaction },
          ),
        );
      }

      if (sourceCategory?.parentCategories?.length) {
        const categories = sourceCategory.parentCategories.map(({ id }) => id);
        promises.push(category.$set('parentCategories', categories, { transaction }));
      }

      if (sourceCategory.portionSizeMethods?.length) {
        promises.push(
          ...sourceCategory.portionSizeMethods.map(psm =>
            CategoryPortionSizeMethod.create(
              {
                ...pick(psm, [
                  'method',
                  'description',
                  'useForRecipes',
                  'conversionFactor',
                  'orderBy',
                  'parameters',
                ]),
                categoryId: category.id,
              },
              { transaction },
            ),
          ),
        );
      }

      await Promise.all(promises);

      return category;
    });

    return (await getCategory({ id: category.id, localeId: category.localeId }))!;
  };

  return {
    browseCategories,
    browseMainCategories,
    copyCategory,
    createCategory,
    getRootCategories,
    getNoCategoryContents,
    getCategoryContents,
    getCategory,
    updateCategory,
  };
}

export default adminCategoryService;

export type AdminCategoryService = ReturnType<typeof adminCategoryService>;
