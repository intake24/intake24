import type { Request, Response } from 'express';
import { pick } from 'lodash';

import { NotFoundError } from '@intake24/api/http/errors';
import { categoryContentsResponse } from '@intake24/api/http/responses/admin';
import type { IoC } from '@intake24/api/ioc';
import type {
  CategoriesResponse,
  CategoryContentsResponse,
  CategoryInput,
  CategoryLocalEntry,
  MainCategoriesResponse,
  RootCategoriesResponse,
} from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';
import { CategoryLocal, SystemLocale } from '@intake24/db';

function adminCategoryController({
  adminCategoryService,
  cachedParentCategoriesService,
}: Pick<IoC, 'adminCategoryService' | 'cachedParentCategoriesService'>) {
  const browse = async (
    req: Request<{ localeId: string }, any, any, PaginateQuery>,
    res: Response<CategoriesResponse>,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categories = await adminCategoryService.browseCategories(
      code,
      pick(req.query, ['page', 'limit', 'sort', 'search']),
    );

    res.json(categories);
  };

  const browseMain = async (
    req: Request<any, any, any, PaginateQuery>,
    res: Response<MainCategoriesResponse>,
  ): Promise<void> => {
    const categories = await adminCategoryService.browseMainCategories(
      pick(req.query, ['page', 'limit', 'sort', 'search']),
    );

    res.json(categories);
  };

  const store = async (
    req: Request<{ localeId: string }, any, CategoryInput>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categoryLocal = await adminCategoryService.createCategory(code, req.body);

    res.json(categoryLocal);
  };

  const read = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categoryLocal = await adminCategoryService.getCategory(categoryId, code);
    if (!categoryLocal)
      throw new NotFoundError();

    res.json(categoryLocal);
  };

  const update = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const { main, ...rest } = req.body;

    const canUpdateMain = !!(
      main?.code
      && ((await aclService.hasPermission('locales:food-list'))
        || (await CategoryLocal.count({ where: { categoryCode: main.code } })) === 1)
    );

    const categoryLocal = await adminCategoryService.updateCategory(
      categoryId,
      code,
      canUpdateMain ? req.body : rest,
    );

    res.json(categoryLocal);
  };

  const destroy = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<undefined>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    await categoryLocal.destroy();

    res.json();
  };

  const root = async (
    req: Request<{ localeId: string }>,
    res: Response<RootCategoriesResponse>,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categories = await adminCategoryService.getRootCategories(code);

    res.json(categories);
  };

  const contents = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<CategoryContentsResponse>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    if (categoryId === 'no-category') {
      const foods = await adminCategoryService.getNoCategoryContents(code);
      res.json(categoryContentsResponse({ categories: [], foods }));
      return;
    }

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id', 'categoryCode'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    const data = await adminCategoryService.getCategoryContents(categoryLocal.categoryCode, code);

    res.json(categoryContentsResponse(data));
  };

  const copy = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categoryLocal = await adminCategoryService.copyCategory(categoryId, code, req.body);

    res.json(categoryLocal);
  };

  const categories = async (
    req: Request,
    res: Response<{ categories: string[] }>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id', 'categoryCode'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    const categories = await cachedParentCategoriesService.getCategoryAllCategories(
      categoryLocal.categoryCode,
    );

    res.json({ categories });
  };

  const browseByLocaleCode = async (
    req: Request<{ localeCode: string }, any, any, PaginateQuery>,
    res: Response<CategoriesResponse>,
  ): Promise<void> => {
    const { localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categories = await adminCategoryService.browseCategories(
      code,
      pick(req.query, ['page', 'limit', 'sort', 'search']),
    );

    res.json(categories);
  };

  const storeByLocaleCode = async (
    req: Request<{ localeCode: string }, any, CategoryInput>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categoryLocal = await adminCategoryService.createCategory(code, req.body);

    res.json(categoryLocal);
  };

  const readByLocaleCode = async (
    req: Request<{ categoryId: string; localeCode: string }>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categoryLocal = await adminCategoryService.getCategory(categoryId, code);
    if (!categoryLocal)
      throw new NotFoundError();

    res.json(categoryLocal);
  };

  const updateByLocaleCode = async (
    req: Request<{ categoryId: string; localeCode: string }>,
    res: Response<CategoryLocalEntry>,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const { main, ...rest } = req.body;

    const canUpdateMain = !!(
      main?.code
      && ((await aclService.hasPermission('locales:food-list'))
        || (await CategoryLocal.count({ where: { categoryCode: main.code } })) === 1)
    );

    const categoryLocal = await adminCategoryService.updateCategory(
      categoryId,
      code,
      canUpdateMain ? req.body : rest,
    );

    res.json(categoryLocal);
  };

  const destroyByLocaleCode = async (
    req: Request<{ categoryId: string; localeCode: string }>,
    res: Response<undefined>,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    await categoryLocal.destroy();

    res.json();
  };

  const rootByLocaleCode = async (
    req: Request<{ localeCode: string }>,
    res: Response<RootCategoriesResponse>,
  ): Promise<void> => {
    const { localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categories = await adminCategoryService.getRootCategories(code);

    res.json(categories);
  };

  const contentsByLocaleCode = async (
    req: Request<{ categoryId: string; localeCode: string }>,
    res: Response<CategoryContentsResponse>,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    if (categoryId === 'no-category') {
      const foods = await adminCategoryService.getNoCategoryContents(code);
      res.json(categoryContentsResponse({ categories: [], foods }));
      return;
    }

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id', 'categoryCode'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    const data = await adminCategoryService.getCategoryContents(categoryLocal.categoryCode, code);

    res.json(categoryContentsResponse(data));
  };

  const copyByLocaleCode = async (
    req: Request<{ categoryId: string; localeCode: string }>,
    res: Response,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categoryLocal = await adminCategoryService.copyCategory(categoryId, code, req.body);

    res.json(categoryLocal);
  };

  const categoriesByLocaleCode = async (
    req: Request,
    res: Response<{ categories: string[] }>,
  ): Promise<void> => {
    const { categoryId, localeCode } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeCode },
    });

    const categoryLocal = await CategoryLocal.findOne({
      attributes: ['id', 'categoryCode'],
      where: { id: categoryId, localeId: code },
    });
    if (!categoryLocal)
      throw new NotFoundError();

    const categories = await cachedParentCategoriesService.getCategoryAllCategories(
      categoryLocal.categoryCode,
    );

    res.json({ categories });
  };

  return {
    browse,
    browseByLocaleCode,
    browseMain,
    store,
    storeByLocaleCode,
    read,
    readByLocaleCode,
    update,
    updateByLocaleCode,
    destroy,
    destroyByLocaleCode,
    root,
    rootByLocaleCode,
    contents,
    contentsByLocaleCode,
    copy,
    copyByLocaleCode,
    categories,
    categoriesByLocaleCode,
  };
}

export default adminCategoryController;

export type AdminCategoryController = ReturnType<typeof adminCategoryController>;
