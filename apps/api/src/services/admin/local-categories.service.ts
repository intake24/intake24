import type { Kysely } from 'kysely';

import { randomUUID } from 'node:crypto';

import { ApplicationError, ConflictError, NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type { PortionSizeMethod, PortionSizeMethodId } from '@intake24/common/surveys';
import type {
  CreateCategoryRequest,
  SimpleCategoryEntry,
  UpdateCategoryRequest,
} from '@intake24/common/types/http/admin';
import type { FoodsDB } from '@intake24/db';

function localCategoriesService({ kyselyDb }: Pick<IoC, 'kyselyDb'>) {
  async function updateParentCategories(categoryId: string, parentCategoryIds: string[], transaction: Kysely<FoodsDB>) {
    await transaction
      .deleteFrom('categoriesCategories')
      .where('subCategoryId', '=', categoryId)
      .execute();

    if (parentCategoryIds.length) {
      const catCatRecords = parentCategoryIds.map(parentId => ({ categoryId: parentId, subCategoryId: categoryId }));

      try {
        await transaction.insertInto('categoriesCategories').values(catCatRecords).execute();
      }
      catch (e: any) {
        if (e.code === '23503')
          throw new ApplicationError(e.detail);

        throw e;
      }
    }
  }

  async function updatePortionSizeMethods(categoryId: string, methods: PortionSizeMethod[], transaction: Kysely<FoodsDB>): Promise<void> {
    await transaction
      .deleteFrom('categoryPortionSizeMethods')
      .where('categoryId', '=', categoryId)
      .execute();

    if (methods.length > 0) {
      await transaction
        .insertInto('categoryPortionSizeMethods')
        .values(
          methods.map((m, index) => ({
            categoryId,
            method: m.method,
            description: m.description,
            useForRecipes: m.useForRecipes,
            conversionFactor: m.conversionFactor,
            orderBy: index,
            parameters: JSON.stringify(m.parameters),
          })),
        )
        .execute();
    }
  }

  const create = async (localeId: string, request: CreateCategoryRequest): Promise<void> => {
    await kyselyDb.foods.transaction().execute(async (t) => {
      try {
        const { id: categoryId } = await t
          .insertInto('categories')
          .values({
            version: request.version || randomUUID(),
            localeId,
            code: request.code,
            englishName: request.englishName,
            name: request.name,
            simpleName: toSimpleName(request.name)!,
            hidden: request.hidden,
            tags: JSON.stringify(request.tags ?? []),
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        await updatePortionSizeMethods(categoryId, request.portionSizeMethods, t);

        if (request.parentCategories)
          await updateParentCategories(categoryId, request.parentCategories, t);

        await t
          .insertInto('categoryAttributes')
          .values({
            categoryId,
            sameAsBeforeOption: request.attributes.sameAsBeforeOption,
            readyMealOption: request.attributes.readyMealOption,
            reasonableAmount: request.attributes.reasonableAmount,
            useInRecipes: request.attributes.useInRecipes,
          })
          .execute();
      }
      catch (e: any) {
        if (e.code === '23505')
          throw new ConflictError();
        else throw e;
      }
    });
  };

  const update = async (
    categoryCode: string,
    localeId: string,
    version: string,
    request: UpdateCategoryRequest,
  ): Promise<void> => {
    await kyselyDb.foods.transaction().execute(async (t) => {
      const result = await t
        .updateTable('categories')
        .set({
          version: randomUUID(),
          localeId,
          englishName: request.englishName,
          name: request.name,
          simpleName: toSimpleName(request.name)!,
          hidden: request.hidden,
          tags: JSON.stringify(request.tags ?? []),
        })
        .where('localeId', '=', localeId)
        .where('code', '=', categoryCode)
        .where('version', '=', version)
        .returning('id')
        .executeTakeFirst();

      if (result === undefined)
        throw new NotFoundError();

      await updatePortionSizeMethods(result.id, request.portionSizeMethods, t);

      if (request.parentCategories)
        await updateParentCategories(result.id, request.parentCategories, t);

      if (
        request.attributes.sameAsBeforeOption
        || request.attributes.readyMealOption
        || request.attributes.reasonableAmount
        || request.attributes.useInRecipes
      ) {
        await t
          .updateTable('categoryAttributes')
          .set({
            sameAsBeforeOption: request.attributes.sameAsBeforeOption,
            readyMealOption: request.attributes.readyMealOption,
            reasonableAmount: request.attributes.reasonableAmount,
            useInRecipes: request.attributes.useInRecipes,
          })
          .where('categoryId', '=', result.id)
          .execute();
      }
    });
  };

  const read = async (localeId: string, categoryCode: string): Promise<SimpleCategoryEntry> => {
    return await kyselyDb.foods.transaction().execute(async (t) => {
      const categoryRow = await t
        .selectFrom('categories')
        .select(['id', 'code', 'englishName', 'name', 'version'])
        .where('localeId', '=', localeId)
        .where('code', '=', categoryCode)
        .executeTakeFirst();

      if (categoryRow === undefined)
        throw new NotFoundError();

      const parentCategoryRows = await t
        .selectFrom('categoriesCategories')
        .select('categoryId')
        .where('subCategoryId', '=', categoryCode)
        .orderBy('categoryId', 'asc')
        .execute();

      const portionSizeRows = await t
        .selectFrom('categoryPortionSizeMethods')
        .select(['method', 'description', 'useForRecipes', 'conversionFactor', 'orderBy', 'parameters'])
        .where('categoryId', '=', categoryRow.id)
        .execute();

      const portionSizeMethods: PortionSizeMethod[] = portionSizeRows.map(row => ({
        method: row.method as PortionSizeMethodId /* unsafe! */,
        conversionFactor: row.conversionFactor,
        description: row.description,
        useForRecipes: row.useForRecipes,
        orderBy: row.orderBy,
        parameters: JSON.parse(row.parameters) /* unsafe! */,
      }));

      return {
        id: categoryRow.id,
        localeId,
        code: categoryRow.code,
        version: categoryRow.version,
        name: categoryRow.name,
        parentCategories: parentCategoryRows.map(r => r.categoryId),
        portionSizeMethods,
      };
    });
  };
  return {
    create,
    update,
    read,
  };
}

export default localCategoriesService;

export type LocalCategoriesService = ReturnType<typeof localCategoriesService>;
