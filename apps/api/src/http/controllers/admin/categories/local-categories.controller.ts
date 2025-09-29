import type { Request, Response } from 'express';
import { HttpStatusCode } from 'axios';
import { ConflictError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { SimpleCategoryEntry } from '@intake24/common/types/http/admin';
import { SystemLocale } from '@intake24/db';

function localCategoriesController({
  localCategoriesService,
}: Pick<IoC, 'localCategoriesService'>) {
  const store = async (req: Request, res: Response): Promise<void> => {
    const { localeId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { code: localeId },
    });

    try {
      await localCategoriesService.create(localeId, req.body);
      res.status(HttpStatusCode.Created);
      res.end();
    }
    catch (e: any) {
      if (e instanceof ConflictError) {
        const existing = await localCategoriesService.read(localeId, req.body.code);
        res.status(HttpStatusCode.Conflict).json(existing);
      }
      else {
        throw e;
      }
    }
  };

  const update = async (req: Request, res: Response): Promise<void> => {
    const { localeId, categoryId } = req.params;
    const { version } = req.query;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { code: localeId },
    });

    await localCategoriesService.update(
      categoryId,
      localeId,
      version as string /* unsafe! */,
      req.body,
    );

    res.end();
  };

  const read = async (req: Request, res: Response<SimpleCategoryEntry>): Promise<void> => {
    const { localeId, categoryId } = req.params;
    const { aclService } = req.scope.cradle;

    await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
      attributes: ['code'],
      where: { code: localeId },
    });

    const result = await localCategoriesService.read(localeId, categoryId);

    res.json(result);
  };

  return {
    store,
    update,
    read,
  };
}

export default localCategoriesController;

export type AdminLocalCategoriesController = ReturnType<typeof localCategoriesController>;
