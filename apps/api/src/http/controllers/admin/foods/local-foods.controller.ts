import type { Request, Response } from 'express';

import type { IoC } from '@intake24/api/ioc';

import { HttpStatusCode } from 'axios';

import { SystemLocale } from '@intake24/db';

function localFoodsController({
  localFoodsService,
  cache,
}: Pick<IoC, 'localFoodsService' | 'cache'>) {
  const store = async (req: Request, res: Response): Promise<void> => {
    const { localeId } = req.params;
    const { update } = req.query;
    const _return = req.query.return;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { code: localeId },
    });

    const created = await localFoodsService.create(localeId, req.body, {
      update: !!update,
      return: !!_return,
    });

    res.status(created ? HttpStatusCode.Created : HttpStatusCode.Ok);

    if (_return) {
      await cache.setAdd('locales-index', localeId);
      const instance = await localFoodsService.read(localeId, req.body.code);
      res.json(instance);
    }
    else {
      res.end();
    }
  };

  const read = async (req: Request, res: Response): Promise<void> => {
    const { localeId, foodId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeId },
    });

    const instance = await localFoodsService.read(localeId, foodId);

    res.json(instance);
  };

  const readEnabledFoods = async (req: Request, res: Response): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeId },
    });

    const codes = await localFoodsService.getFoodCodes(localeId);
    res.json(codes);
  };

  return {
    read,
    readEnabledFoods,
    store,
  };
}

export default localFoodsController;

export type AdminLocalFoodsController = ReturnType<typeof localFoodsController>;
