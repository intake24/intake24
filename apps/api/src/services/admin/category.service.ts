import type { CacheKey } from '../core/redis/cache';

import { randomUUID } from 'node:crypto';

import { pick } from 'lodash';
import { NotFoundError } from '@intake24/api/http/errors';
import { categoryResponse } from '@intake24/api/http/responses/admin';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type {
  CategoryInput,
  CategoryListEntry,
  CategoryLocalCopyInput,
  CategoryLocalInput,
} from '@intake24/common/types/http/admin';
import type {
  CategoryAttributes,
  CategoryLocalAttributes,
  FindOptions,
  PaginateQuery,
  Transaction,
} from '@intake24/db';
import {
  Category,
  CategoryAttribute,
  CategoryLocal,
  CategoryPortionSizeMethod,
  FoodLocal,
  Op,
  QueryTypes,
} from '@intake24/db';

function adminCategoryService({ cache, db }: Pick<IoC, 'cache' | 'db'>) {
  const browseCategories = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<CategoryLocalAttributes> = {
      where: { localeId },
      include: [{ association: 'main', required: true }],
    };
    const { search } = query;

    if (search) {
      const op
        = CategoryLocal.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['categoryCode', 'name', '$main.name$'].map(column => ({ [column]: op }));

      options.where = { ...options.where, [Op.or]: ops };
    }

    return CategoryLocal.paginate({
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
      c.code, c.name as "englishName", c.is_hidden as "isHidden", cl.id, cl.locale_id as "localeId", cl.name
      FROM categories c
      LEFT JOIN categories_categories cc ON c.code = cc.subcategory_code
      LEFT JOIN category_locals cl ON c.code = cl.category_code
      WHERE NOT EXISTS (
        SELECT * from categories_categories cc2 JOIN categories c2 ON cc2.category_code = c2.code
        WHERE c2.is_hidden = :isHidden AND cc2.subcategory_code = c.code
      )
      AND cl.locale_id = :localeId
      ORDER BY cl.name`;

    return db.foods.query<CategoryListEntry>(query, {
      type: QueryTypes.SELECT,
      replacements: { localeId, isHidden: false },
    });

    /* const categories = await Category.findAll({
      attributes: ['code', 'description', 'isHidden'],
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

  const getCategoryContents = async (categoryCode: string, localeId?: string) => {
    const [categories, foods] = await Promise.all([
      CategoryLocal.findAll({
        where: localeId ? { localeId } : {},
        include: [
          {
            association: 'main',
            attributes: ['name', 'isHidden'],
            required: true,
            include: [
              {
                association: 'parentCategoryMappings',
                attributes: [],
                where: { categoryCode },
              },
            ],
          },
        ],
        order: [['name', 'ASC']],
      }),
      FoodLocal.findAll({
        where: { localeId },
        include: [
          {
            association: 'main',
            attributes: ['name'],
            required: true,
            include: [
              { association: 'parentCategoryMappings', attributes: [], where: { categoryCode } },
            ],
          },
        ],
        order: [['name', 'ASC']],
      }),
    ]);

    return { categories, foods };
  };

  const getNoCategoryContents = async (localeId: string) =>
    FoodLocal.findAll({
      where: {
        localeId,
        '$main->parentCategoryMappings.category_code$': null,
      },
      include: [
        {
          association: 'main',
          attributes: ['name'],
          required: true,
          include: [
            {
              association: 'parentCategoryMappings',
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

  const getCategory = async (categoryId: string, localeCode?: string) => {
    const where = localeCode ? { localeId: localeCode } : {};

    return CategoryLocal.findOne({
      where: { ...where, id: categoryId },
      include: [
        {
          association: 'main',
          required: true,
          include: [
            { association: 'attributes' },
            {
              association: 'parentCategories',
              through: { attributes: [] },
              include: [{ association: 'locals', attributes: ['name'], where }],
            },
          ],
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
    categoryLocalId: string,
    methods: CategoryPortionSizeMethod[],
    inputs: CategoryLocalInput['portionSizeMethods'],
    { transaction }: { transaction: Transaction },
  ) => {
    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await CategoryPortionSizeMethod.destroy({
      where: { categoryLocalId, id: { [Op.notIn]: ids } },
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
        { ...rest, categoryLocalId },
        { transaction },
      );
      newMethods.push(newMethod);
    }

    return [...methods, ...newMethods];
  };

  const createCategory = async (localeCode: string, input: CategoryInput) => {
    const categoryLocal = await db.foods.transaction(async (transaction) => {
      let main = await Category.findByPk(input.code, { transaction });
      if (!main) {
        main = await Category.create({ ...input, version: randomUUID() }, { transaction });

        if (input.parentCategories?.length) {
          const categories = input.parentCategories.map(({ code }) => code);
          await main.$set('parentCategories', categories, { transaction });
        }
      }

      const categoryLocal = await CategoryLocal.create(
        {
          categoryCode: main.code,
          localeId: localeCode,
          name: main.name,
          simpleName: toSimpleName(main.name)!,
          version: randomUUID(),
        },
        { transaction },
      );

      return categoryLocal;
    });

    return (await getCategory(categoryLocal.id, localeCode))!;
  };

  const updateCategory = async (
    categoryLocalId: string,
    localeCode: string,
    input: CategoryLocalInput,
  ) => {
    const categoryLocal = await getCategory(categoryLocalId, localeCode);
    if (!categoryLocal)
      throw new NotFoundError();

    const { main, portionSizeMethods } = categoryLocal;
    if (!main || !portionSizeMethods)
      throw new NotFoundError();

    const categoryCacheKeys: CacheKey[] = [
      `category-all-categories:${main.code}`,
      `category-parent-categories:${main.code}`,
    ];

    await db.foods.transaction(async (transaction) => {
      const promises: Promise<any>[] = [
        categoryLocal.update(pick(input, ['name', 'tags']), { transaction }),
        main.update(pick(input.main, ['name', 'isHidden']), { transaction }),
        updatePortionSizeMethods(categoryLocalId, portionSizeMethods, input.portionSizeMethods, {
          transaction,
        }),
      ];

      if (input.main) {
        if (input.main.parentCategories) {
          const categories = (input.main.parentCategories).map(cat => cat.code);
          promises.push(main.$set('parentCategories', categories, { transaction }));
        }

        if (input.main.attributes) {
          const attributesInput = pick(input.main.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
          if (Object.values(attributesInput).every(item => item === null)) {
            if (main.attributes)
              promises.push(main.attributes.destroy({ transaction }));
          }
          else {
            promises.push(
              main.attributes
                ? main.attributes.update(attributesInput, { transaction })
                : CategoryAttribute.create({ categoryCode: main.code, ...attributesInput }, { transaction }),
            );
          }
        }
      }

      await Promise.all(promises);

      if (input.main && main.code !== input.main.code) {
        await Category.update(
          { code: input.main.code },
          { where: { code: main.code }, transaction },
        );
        categoryCacheKeys.push(`category-all-categories:${input.main.code}`, `category-parent-categories:${input.main.code}`);
      }
    });

    await cache.forget(categoryCacheKeys);

    return (await getCategory(categoryLocalId, localeCode))!;
  };

  const copyCategory = async (
    categoryLocalId: string,
    localeCode: string,
    input: CategoryLocalCopyInput,
  ) => {
    const sourceCategoryLocal = await getCategory(categoryLocalId, localeCode);
    if (!sourceCategoryLocal)
      throw new NotFoundError();

    const categoryLocal = await db.foods.transaction(async (transaction) => {
      const category = await Category.create(
        {
          ...pick(sourceCategoryLocal.main!, ['code', 'name']),
          ...input,
          version: randomUUID(),
        },
        { transaction },
      );
      const categoryLocal = await CategoryLocal.create(
        {
          ...pick(sourceCategoryLocal, ['localeId', 'name', 'simpleName', 'tags']),
          categoryCode: category.code,
          name: input.name,
          version: randomUUID(),
        },
        { transaction },
      );

      const promises: Promise<any>[] = [];

      if (sourceCategoryLocal.main?.attributes) {
        promises.push(
          CategoryAttribute.create(
            {
              ...pick(sourceCategoryLocal.main.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']),
              categoryCode: category.code,
            },
            { transaction },
          ),
        );
      }

      if (sourceCategoryLocal.main?.parentCategories?.length) {
        const categories = sourceCategoryLocal.main.parentCategories.map(({ code }) => code);
        promises.push(category.$set('parentCategories', categories, { transaction }));
      }

      if (sourceCategoryLocal.portionSizeMethods?.length) {
        promises.push(
          ...sourceCategoryLocal.portionSizeMethods.map(psm =>
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
                categoryLocalId: categoryLocal.id,
              },
              { transaction },
            ),
          ),
        );
      }

      await Promise.all(promises);

      return categoryLocal;
    });

    return (await getCategory(categoryLocal.id, localeCode))!;
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
