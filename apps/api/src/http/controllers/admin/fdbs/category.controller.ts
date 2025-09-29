import type { Request, Response } from 'express';
import { pick } from 'lodash';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type {
  CategoriesResponse,
  CategoryContentsResponse,
  CategoryEntry,
  CategoryInput,
  MainCategoriesResponse,
  RootCategoriesResponse,
} from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';
import { Category, SystemLocale } from '@intake24/db';

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
    res: Response<CategoryEntry>,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const category = await adminCategoryService.createCategory(code, req.body);

    res.json(category);
  };

  const read = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<CategoryEntry>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const category = await adminCategoryService.getCategory({ id: categoryId, localeId: code });
    if (!category)
      throw new NotFoundError();

    res.json(category);
  };

  const update = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<CategoryEntry>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const category = await adminCategoryService.updateCategory(code, categoryId, req.body);

    res.json(category);
  };

  const destroy = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response<undefined>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const category = await Category.findOne({
      attributes: ['id'],
      where: { id: categoryId, localeId: code },
    });
    if (!category)
      throw new NotFoundError();

    await category.destroy();

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
      res.json({ categories: [], foods });
      return;
    }

    const data = await adminCategoryService.getCategoryContents(code, categoryId);

    res.json(data);
  };

  const copy = async (
    req: Request<{ categoryId: string; localeId: string }>,
    res: Response,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const category = await adminCategoryService.copyCategory(code, categoryId, req.body);

    res.json(category);
  };

  const categories = async (
    req: Request,
    res: Response<{ categories: string[] }>,
  ): Promise<void> => {
    const { categoryId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categories = await cachedParentCategoriesService.getCategoryAllCategories(categoryId);

    res.json({ categories });
  };

  return {
    browse,
    browseMain,
    store,
    read,
    update,
    destroy,
    root,
    contents,
    copy,
    categories,
  };
}

export default adminCategoryController;

export type AdminCategoryController = ReturnType<typeof adminCategoryController>;
