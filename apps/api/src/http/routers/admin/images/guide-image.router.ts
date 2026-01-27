import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { imageResponseCollection } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { GuideImage, ImageMap } from '@intake24/db';

async function uniqueMiddleware(value: any, { guideImageId }: { guideImageId?: string } = {}) {
  const where: WhereOptions = guideImageId ? { id: { [Op.ne]: guideImageId } } : {};

  if (!(await unique({ model: GuideImage, condition: { field: 'id', value }, options: { where } }))) {
    throw ValidationError.from({ code: '$unique', path: 'id', i18n: { type: 'unique._' } });
  }
}

async function dataCheck(imageMapId: string) {
  const imageMap = await ImageMap.findByPk(imageMapId, { attributes: ['id'] });

  if (!imageMap)
    throw ValidationError.from({ path: 'imageMapId', i18n: { type: 'exists._' } });
}

export function guideImage() {
  const responseCollection = imageResponseCollection(ioc.cradle.imagesBaseUrl);

  return initServer().router(contract.admin.images.guideImage, {
    browse: {
      middleware: [permission('guide-images', 'guide-images:browse')],
      handler: async ({ query }) => {
        const guideImages = await GuideImage.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('GuideImage.id')), 'ASC']],
          include: ['selectionImage'],
          transform: responseCollection.guideListResponse,
        });

        return { status: 200, body: guideImages };
      },
    },
    store: {
      middleware: [permission('guide-images', 'guide-images:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.id);
        await dataCheck(body.imageMapId);

        await req.scope.cradle.guideImageService.create(body);

        const guideImage = await req.scope.cradle.portionSizeService.getGuideImage(body.id);
        if (!guideImage)
          throw new NotFoundError();

        return { status: 201, body: responseCollection.guideEntryResponse(guideImage) };
      },
    },
    read: {
      middleware: [permission('guide-images', 'guide-images:read')],
      handler: async ({ params: { guideImageId }, req }) => {
        const guideImage = await req.scope.cradle.portionSizeService.getGuideImage(guideImageId);
        if (!guideImage)
          throw new NotFoundError();

        return { status: 200, body: responseCollection.guideEntryResponse(guideImage) };
      },
    },
    update: {
      middleware: [permission('guide-images', 'guide-images:edit')],
      handler: async ({ body, params: { guideImageId }, req }) => {
        const guideImage = await req.scope.cradle.guideImageService.update(guideImageId, body);

        return { status: 200, body: responseCollection.guideEntryResponse(guideImage) };
      },
    },
    destroy: {
      middleware: [permission('guide-images', 'guide-images:delete')],
      handler: async ({ params: { guideImageId }, req }) => {
        await req.scope.cradle.guideImageService.destroy(guideImageId);

        return { status: 204, body: undefined };
      },
    },
  });
}
