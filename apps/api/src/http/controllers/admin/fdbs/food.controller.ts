import type { Request, Response } from 'express';
import { pick } from 'lodash';

import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type {
  FoodEntry,
  FoodInput,
  FoodsResponse,
} from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';
import { SystemLocale } from '@intake24/db';

function adminFoodController({
  adminFoodService,
  cachedParentCategoriesService,
}: Pick<IoC, 'adminFoodService' | 'cachedParentCategoriesService'>) {
  const browse = async (
    req: Request<{ localeId: string }, any, any, PaginateQuery>,
    res: Response<FoodsResponse>,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const foods = await adminFoodService.browseFoods(
      code,
      pick(req.query, ['page', 'limit', 'sort', 'search']),
    );

    res.json(foods);
  };

  const store = async (
    req: Request<{ localeId: string }, any, FoodInput>,
    res: Response,
  ): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const food = await adminFoodService.createFood(code, req.body);

    res.json(food);
  };

  const read = async (
    req: Request<{ foodId: string; localeId: string }>,
    res: Response<FoodEntry>,
  ): Promise<void> => {
    const { foodId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const food = await adminFoodService.getFood({ id: foodId, localeId: code });
    if (!food)
      throw new NotFoundError();

    res.json(food);
  };

  const readByCode = async (
    req: Request<{ foodCode: string; localeId: string }>,
    res: Response<FoodEntry>,
  ): Promise<void> => {
    const { foodCode, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const food = await adminFoodService.getFood({ localeId: code, code: foodCode });
    if (!food)
      throw new NotFoundError();

    res.json(food);
  };

  const update = async (
    req: Request<{ foodId: string; localeId: string }, any, FoodInput>,
    res: Response<FoodEntry>,
  ): Promise<void> => {
    const { foodId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const food = await adminFoodService.updateFood(code, foodId, req.body);

    res.json(food);
  };

  const destroy = async (
    req: Request<{ foodId: string; localeId: string }>,
    res: Response<undefined>,
  ): Promise<void> => {
    const { foodId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    await adminFoodService.deleteFood(code, foodId);

    res.status(204).json();
  };

  const copy = async (
    req: Request<{ foodId: string; localeId: string }>,
    res: Response<FoodEntry>,
  ): Promise<void> => {
    const { foodId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const food = await adminFoodService.copyFood({ foodId, localeId }, req.body);

    res.json(food);
  };

  const categories = async (
    req: Request,
    res: Response<{ categories: string[] }>,
  ): Promise<void> => {
    const { foodId, localeId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { id: localeId },
    });

    const categories = await cachedParentCategoriesService.getFoodAllCategories(foodId);

    res.json({ categories });
  };

  return {
    browse,
    store,
    read,
    readByCode,
    update,
    destroy,
    copy,
    categories,
  };
}

export default adminFoodController;

export type AdminFoodController = ReturnType<typeof adminFoodController>;
