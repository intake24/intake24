import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { Category, SystemLocale } from '@intake24/db';

async function uniqueMiddleware(value: any, { categoryId, field, localeId }: { categoryId?: string; field: string; localeId: string }) {
  const where: WhereOptions = categoryId ? { localeId, id: { [Op.ne]: categoryId } } : { localeId };

  if (!(await unique({ model: Category, condition: { field, value }, options: { where } }))) {
    throw ValidationError.from({ code: '$unique', path: field, i18n: { type: 'unique._' } });
  }
}

export function category() {
  return initServer().router(contract.admin.fdbs.category, {
    browse: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, query, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const categories = await adminCategoryService.browseCategories(code, query);

        return { status: 200, body: categories };
      },
    },
    store: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', localeId: code });

        const category = await adminCategoryService.createCategory(code, body);

        return { status: 201, body: category };
      },
    },
    root: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const categories = await adminCategoryService.getRootCategories(code);

        return { status: 200, body: categories };
      },
    },
    read: {
      middleware: [permission('locales')],
      handler: async ({ params: { categoryId, localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const category = await adminCategoryService.getCategory({ id: categoryId, localeId: code });
        if (!category)
          throw new NotFoundError();

        return { status: 200, body: category };
      },
    },
    update: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { categoryId, localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', categoryId, localeId: code });

        const category = await adminCategoryService.updateCategory(code, categoryId, body);

        return { status: 200, body: category };
      },
    },
    destroy: {
      middleware: [permission('locales')],
      handler: async ({ params: { categoryId, localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });

        await adminCategoryService.deleteCategory(code, categoryId);

        return { status: 204, body: undefined };
      },
    },
    copy: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { categoryId, localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', categoryId, localeId: code });

        const category = await adminCategoryService.copyCategory(code, categoryId, body);

        return { status: 200, body: category };
      },
    },
    categories: {
      middleware: [permission('locales')],
      handler: async ({ params: { categoryId, localeId }, req }) => {
        const { aclService, cachedParentCategoriesService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const categories = await cachedParentCategoriesService.getCategoryAllCategories(categoryId);

        return { status: 200, body: categories };
      },
    },
    contents: {
      middleware: [permission('locales')],
      handler: async ({ params: { categoryId, localeId }, req }) => {
        const { aclService, adminCategoryService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        if (categoryId === 'no-category') {
          const foods = await adminCategoryService.getNoCategoryContents(code);
          return { status: 200, body: { categories: [], foods } };
        }

        const data = await adminCategoryService.getCategoryContents(code, categoryId);

        return { status: 200, body: data };
      },
    },
  });
}
