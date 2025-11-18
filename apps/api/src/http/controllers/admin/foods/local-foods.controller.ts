import type { Request, Response } from 'express';
import { HttpStatusCode } from 'axios';

import { ForbiddenError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';

function localFoodsController({
  localFoodsService,
  cache,
}: Pick<IoC, 'localFoodsService' | 'cache'>) {
  const store = async (req: Request, res: Response): Promise<void> => {
    const { aclService } = req.scope.cradle;

    const { localeId } = req.params;

    const { update } = req.query;

    const _return = req.query.return;

    if (!(await aclService.hasPermission('fdbs:edit')))
      throw new ForbiddenError();

    const created = await localFoodsService.create(localeId, req.body, {
      update: !!update,
      return: !!_return,
    });

    res.status(created ? HttpStatusCode.Created : HttpStatusCode.Ok);

    if (_return) {
      await cache.push('indexing-locales', localeId);
      const instance = await localFoodsService.read(localeId, req.body.code);
      res.json(instance);
    }
    else {
      res.end();
    }
  };

  const read = async (req: Request<{ localeId: string; foodCode: string }>, res: Response): Promise<void> => {
    const { aclService } = req.scope.cradle;

    const { localeId, foodCode } = req.params;

    if (!(await aclService.hasPermission('fdbs:read')))
      throw new ForbiddenError();

    const instance = await localFoodsService.read(localeId, foodCode);

    res.status(HttpStatusCode.Ok);
    res.json(instance);
  };

  const destroy = async (req: Request<{ localeId: string; foodCode: string }>, res: Response): Promise<void> => {
    const { aclService } = req.scope.cradle;

    if (!(await aclService.hasPermission('fdbs:edit')))
      throw new ForbiddenError();

    const { localeId, foodCode } = req.params;

    await localFoodsService.destroy(localeId, foodCode);
    await cache.push('indexing-locales', localeId);

    res.status(HttpStatusCode.NoContent);
    res.end();
  };

  const readEnabledFoods = async (req: Request, res: Response): Promise<void> => {
    const { aclService } = req.scope.cradle;

    if (!(await aclService.hasPermission('fdbs:read')))
      throw new ForbiddenError();
    const enabledFoods = await localFoodsService.readEnabledFoods(req.params.localeId);
    res.status(HttpStatusCode.Ok);
    res.json({ enabledFoods });
  };

  const updateEnabledFoods = async (req: Request, res: Response): Promise<void> => {
    const { aclService } = req.scope.cradle;

    if (!(await aclService.hasPermission('fdbs:edit')))
      throw new ForbiddenError();
    await localFoodsService.updateEnabledFoods(req.params.localeId, req.body.enabledFoods);
    await cache.push('indexing-locales', req.params.localeId);
    res.status(HttpStatusCode.Ok);
    res.end();
  };

  return {
    read,
    store,
    destroy,
    readEnabledFoods,
    updateEnabledFoods,
  };
}

export default localFoodsController;

export type AdminLocalFoodsController = ReturnType<typeof localFoodsController>;
