import type { Request, Response } from 'express';

import type { IoC } from '@intake24/api/ioc';
import type { DrinkwareScaleEntry, DrinkwareScaleV2Entry } from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';

import { HttpStatusCode } from 'axios';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';

function drinkScaleController({ drinkwareSetService }: Pick<IoC, 'drinkwareSetService'>) {
  const browse = async (
    req: Request<{ drinkwareSetId: string }, any, any, PaginateQuery>,
    res: Response<(DrinkwareScaleEntry | DrinkwareScaleV2Entry)[]>,
  ): Promise<void> => {
    const { drinkwareSetId } = req.params;

    const scales = await drinkwareSetService.getDrinkScales(drinkwareSetId);

    res.json(scales);
  };

  const read = async (
    req: Request<{ drinkwareSetId: string; choiceId: string }>,
    res: Response<DrinkwareScaleEntry | DrinkwareScaleV2Entry>,
  ): Promise<void> => {
    const { drinkwareSetId, choiceId } = req.params;

    const scale = await drinkwareSetService.getDrinkScale(drinkwareSetId, choiceId);

    res.json(scale);
  };
  const storeV1 = async (
    req: Request<
      { drinkwareSetId: string; choiceId: string },
      any,
      any,
      { updateOnConflict: string; return: string }
    >,
    res: Response<DrinkwareScaleEntry | undefined>,
  ): Promise<void> => {
    const { userId } = req.scope.cradle.user;

    const { drinkwareSetId, choiceId } = req.params;
    const updateOnConflict = req.query.updateOnConflict === 'true';
    const returning = req.query.return === 'true';

    if (req.files === undefined)
      throw new ValidationError('Drink scale image files are missing.', { path: 'baseImage' });

    if (Array.isArray(req.files))
      throw new Error(`Excepted uploaded files to be a record, but got an array`);

    const { baseImage, overlayImage } = req.files;
    const { label, width, height, emptyLevel, fullLevel, volumeSamples } = req.body;

    await drinkwareSetService.createDrinkScaleV1(
      drinkwareSetId,
      choiceId,
      userId,
      baseImage[0],
      overlayImage[0],
      label,
      width,
      height,
      fullLevel,
      emptyLevel,
      volumeSamples,
      updateOnConflict,
    );

    res.status(HttpStatusCode.Created);

    if (returning) {
      const scale = await drinkwareSetService.getDrinkScaleV1(drinkwareSetId, choiceId);
      res.json(scale);
    }
    else {
      res.end();
    }
  };

  const storeV2 = async (
    req: Request<
      { drinkwareSetId: string; choiceId: string },
      any,
      any,
      { updateOnConflict: string; return: string }
    >,
    res: Response<DrinkwareScaleV2Entry | undefined>,
  ): Promise<void> => {
    const { userId } = req.scope.cradle.user;

    const { drinkwareSetId, choiceId } = req.params;
    const updateOnConflict = req.query.updateOnConflict === 'true';
    const returning = req.query.return === 'true';
    const file = req.file;
    const { label, outlineCoordinates, volumeSamples, volumeMethod } = req.body;

    if (!file)
      throw new ValidationError('Drink scale base image file missing.', { path: 'image' });

    await drinkwareSetService.createDrinkScaleV2(
      drinkwareSetId,
      choiceId,
      userId,
      file,
      label,
      outlineCoordinates,
      volumeSamples,
      volumeMethod,
      updateOnConflict,
    );

    res.status(HttpStatusCode.Created);

    if (returning) {
      const scale = await drinkwareSetService.getDrinkScaleV2(drinkwareSetId, choiceId);
      res.json(scale);
    }
    else {
      res.end();
    }
  };

  const destroy = async (
    req: Request<{ drinkwareSetId: string; choiceId: string }>,
    res: Response,
  ): Promise<void> => {
    const { drinkwareSetId, choiceId } = req.params;

    const destroyed = await drinkwareSetService.destroyDrinkScale(drinkwareSetId, choiceId);

    if (destroyed === 0n) {
      throw new NotFoundError(
        `Drinkware set ${drinkwareSetId} has no drink scale for object ${choiceId}`,
      );
    }

    res.status(HttpStatusCode.Ok).end();
  };

  const destroyAll = async (
    req: Request<{ drinkwareSetId: string }>,
    res: Response,
  ): Promise<void> => {
    const { drinkwareSetId } = req.params;

    await drinkwareSetService.destroyAllDrinkScales(drinkwareSetId);

    res.status(HttpStatusCode.Ok).end();
  };

  const refs = async (): Promise<void> => {
    throw new NotFoundError();
  };

  return {
    browse,
    read,
    storeV1,
    storeV2,
    destroy,
    destroyAll,
    refs,
  };
}

export default drinkScaleController;

export type DrinkScaleController = ReturnType<typeof drinkScaleController>;
