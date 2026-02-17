import type { Insertable, Kysely } from 'kysely';

import type { CacheKey } from '../core/redis/cache';
import type { IoC } from '@intake24/api/ioc';
import type {
  BulkCategoryInput,
  CategoryCopyInput,
  CategoryInput,
} from '@intake24/common/types/http/admin';
import type {
  CategoryAttributes,
  FindOptions,
  FoodsDB,
  OnConflictOption,
  PaginateQuery,
  Transaction,
} from '@intake24/db';

import { randomUUID } from 'node:crypto';

import { pick } from 'lodash-es';

import { ConflictError, NotFoundError } from '@intake24/api/http/errors';
import { categoryResponse } from '@intake24/api/http/responses/admin';
import { toSimpleName } from '@intake24/api/util';
import {
  Category,
  CategoryAttribute,
  CategoryPortionSizeMethod,
  Op,
} from '@intake24/db';

function adminCategoryService({ cache, db, kyselyDb }: Pick<IoC, 'cache' | 'db' | 'kyselyDb'>) {
  function getCategoryCacheKeys(categoryId: string): CacheKey[] {
    return [
      `category-all-categories:${categoryId}`,
      `category-parent-categories:${categoryId}`,
    ];
  }

  const browseCategories = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<CategoryAttributes> = { where: { localeId } };
    const { search } = query;

    if (search) {
      const ops = ['code', 'englishName', 'name'].map(column => ({ [column]: { [Op.iLike]: `%${search}%` } }));
      options.where = { ...options.where, [Op.or]: ops };
    }

    return Category.paginate({
      query,
      transform: categoryResponse,
      ...options,
    });
  };

  const getRootCategories = async (localeId: string) => {
    return await kyselyDb.foods
      .selectFrom('categories')
      .select([
        'id',
        'localeId',
        'code',
        'englishName',
        'name',
        'hidden',
      ])
      .distinct()
      .leftJoin('categoriesCategories as cc', 'categories.id', 'cc.subCategoryId')
      .where('categories.localeId', '=', localeId)
      .where(eb =>
        eb.not(
          eb.exists(eb.selectFrom('categoriesCategories as cc2')
            .innerJoin('categories as c2', 'cc2.categoryId', 'c2.id')
            .select('cc2.categoryId')
            .whereRef('cc2.subCategoryId', '=', eb.ref('categories.id'))
            .where('c2.hidden', '=', false)),

        ),
      )
      .orderBy('name')
      .execute();
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
        { association: 'attributes' },
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
  ): Promise<void> => {
    if (!inputs)
      return;

    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await CategoryPortionSizeMethod.destroy({
      where: { categoryId, id: { [Op.notIn]: ids } },
      transaction,
    });

    if (!inputs.length)
      return;

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

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', localeId),
        updatePortionSizeMethods(category.id, [], input.portionSizeMethods, { transaction }),
      ];

      if (input.parentCategories?.length) {
        const categories = input.parentCategories.map(({ id }) => id);
        promises.push(category.$add('parentCategories', categories, { transaction }));
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).some(item => item !== null)) {
          promises.push(CategoryAttribute.create({ categoryId: category.id, ...attributesInput }, { transaction }));
        }
      }

      await Promise.all(promises);

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
        cache.forget(getCategoryCacheKeys(categoryId)),
        cache.setAdd('locales-index', localeId),
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

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', category.localeId),
      ];

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
                  'pathways',
                  'conversionFactor',
                  'defaultWeight',
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

  const deleteCategory = async (localeId: string, categoryId: string) => {
    const category = await Category.findOne({ attributes: ['id', 'code'], where: { id: categoryId, localeId } });
    if (!category)
      throw new NotFoundError();

    await Promise.all([
      category.destroy(),
      cache.forget(getCategoryCacheKeys(categoryId)),
      cache.setAdd('locales-index', localeId),
    ]);
  };

  const bulkUpdateCategoryParents = async (
    transaction: Kysely<FoodsDB>,
    localeId: string,
    input: BulkCategoryInput[],
    idMap: Map<string, string>,
  ) => {
    const parentCodes = new Set<string>();

    for (const item of input) {
      if (item.parentCategories) {
        item.parentCategories.forEach(code => parentCodes.add(code));
      }
    }

    if (parentCodes.size === 0)
      return;

    const databaseRefs = await transaction.selectFrom('categories')
      .select(['code', 'id'])
      .where('localeId', '=', localeId)
      .where('code', 'in', Array.from(parentCodes))
      .execute();

    const parentIdMap = new Map(databaseRefs.map(r => [r.code, r.id]));

    // Allow references within the same batch
    for (const [code, id] of idMap) {
      if (!parentIdMap.has(code))
        parentIdMap.set(code, id);
    }

    const records: { categoryId: string; subCategoryId: string }[] = [];

    for (const item of input) {
      const subCategoryId = idMap.get(item.code);
      if (!subCategoryId || !item.parentCategories?.length)
        continue;

      for (const parentCode of item.parentCategories) {
        const parentId = parentIdMap.get(parentCode);
        if (parentId) {
          records.push({ categoryId: parentId, subCategoryId });
        }
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('categoriesCategories')
        .where('subCategoryId', 'in', Array.from(idMap.values()))
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('categoriesCategories')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateCategoryAttributes = async (
    transaction: Kysely<FoodsDB>,
    input: BulkCategoryInput[],
    idMap: Map<string, string>,
  ) => {
    const records: Insertable<FoodsDB['categoryAttributes']>[] = [];

    for (const item of input) {
      if (!item.attributes)
        continue;

      const categoryId = idMap.get(item.code);
      if (!categoryId)
        continue;

      const attrs = pick(item.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);

      if (Object.values(attrs).some(v => v !== null && v !== undefined)) {
        records.push({ categoryId, ...attrs });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('categoryAttributes')
        .where('categoryId', 'in', Array.from(idMap.values()))
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('categoryAttributes')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateCategoryPortionSizeMethods = async (
    transaction: Kysely<FoodsDB>,
    input: BulkCategoryInput[],
    idMap: Map<string, string>,
  ) => {
    const records: Insertable<FoodsDB['categoryPortionSizeMethods']>[] = [];

    for (const item of input) {
      if (!item.portionSizeMethods?.length)
        continue;

      const categoryId = idMap.get(item.code);
      if (!categoryId)
        continue;

      for (const psm of item.portionSizeMethods) {
        records.push({
          categoryId,
          method: psm.method,
          description: psm.description,
          pathways: psm.pathways,
          conversionFactor: psm.conversionFactor,
          defaultWeight: psm.defaultWeight,
          orderBy: psm.orderBy,
          parameters: psm.parameters,
        });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('categoryPortionSizeMethods')
        .where('categoryId', 'in', Array.from(idMap.values()))
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('categoryPortionSizeMethods')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateCategories = async (
    localeId: string,
    input: BulkCategoryInput[],
    onConflict: OnConflictOption,
    transaction?: Kysely<FoodsDB>,
  ) => {
    if (input.length === 0)
      return;

    const impl = async (transaction: Kysely<FoodsDB>) => {
      const values = input.map(category => ({
        code: category.code,
        localeId,
        englishName: category.englishName,
        name: category.name,
        simpleName: toSimpleName(category.name)!,
        hidden: category.hidden,
        // Postgres gets confused between JSON array and native array when receiving an array like this,
        // stringify makes it accept it as JSON
        tags: JSON.stringify(category.tags ?? []),
        version: randomUUID(),
      }));

      let rows: { id: string; code: string }[] = [];

      switch (onConflict) {
        case 'overwrite': {
          rows = await transaction
            .insertInto('categories')
            .values(values)
            .onConflict(oc => oc
              .columns(['localeId', 'code'])
              .doUpdateSet({
                englishName: eb => eb.ref('excluded.englishName'),
                name: eb => eb.ref('excluded.name'),
                simpleName: eb => eb.ref('excluded.simpleName'),
                hidden: eb => eb.ref('excluded.hidden'),
                tags: eb => eb.ref('excluded.tags'),
                version: eb => eb.ref('excluded.version'),
              }),
            )
            .returning(['id', 'code'])
            .execute();
          break;
        }

        case 'skip': {
          rows = await transaction
            .insertInto('categories')
            .values(values)
            .onConflict(oc => oc
              .columns(['localeId', 'code'])
              .doNothing(),
            )
            .returning(['id', 'code']) // rows will conflicts will not be returned
            .execute();
          break;
        }

        case 'abort': {
          const codes = input.map(c => c.code);
          const existingCategories = await transaction
            .selectFrom('categories')
            .select(['code'])
            .where('localeId', '=', localeId)
            .where('code', 'in', codes)
            .execute();

          if (existingCategories.length > 0) {
            const conflictingCodes = existingCategories.map(c => c.code);
            throw new ConflictError(`Category codes already exist: ${conflictingCodes.join(', ')}`);
          }

          rows = await transaction
            .insertInto('categories')
            .values(values)
            .returning(['id', 'code'])
            .execute();
          break;
        }
      }

      const idMap = new Map(rows.map(r => [r.code, r.id]));
      const affectedRows = input.filter(i => idMap.has(i.code));

      await bulkUpdateCategoryParents(transaction, localeId, affectedRows, idMap);
      await bulkUpdateCategoryAttributes(transaction, affectedRows, idMap);
      await bulkUpdateCategoryPortionSizeMethods(transaction, affectedRows, idMap);

      if (affectedRows.length > 0) {
        await cache.forget(affectedRows.map(i => i.code).flatMap(getCategoryCacheKeys));
        await cache.setAdd('locales-index', localeId);
      }
    };

    if (transaction) {
      await impl(transaction);
    }
    else {
      await kyselyDb.foods.transaction().execute(impl);
    }
  };

  return {
    browseCategories,
    bulkUpdateCategories,
    bulkUpdateCategoryAttributes,
    bulkUpdateCategoryParents,
    bulkUpdateCategoryPortionSizeMethods,
    copyCategory,
    createCategory,
    getRootCategories,
    getNoCategoryContents,
    getCategoryContents,
    getCategory,
    updateCategory,
    deleteCategory,
  };
}

export default adminCategoryService;

export type AdminCategoryService = ReturnType<typeof adminCategoryService>;
