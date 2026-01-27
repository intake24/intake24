import { initServer } from '@ts-rest/express';
import multer from 'multer';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { imageResponseCollection } from '@intake24/api/http/responses/admin';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { imageMulterFile } from '@intake24/common/types/http/admin';
import { AsServedImage, AsServedSet } from '@intake24/db';

export function asServedImage() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });
  const responseCollection = imageResponseCollection(ioc.cradle.imagesBaseUrl);

  return initServer().router(contract.admin.images.asServedImage, {
    browse: {
      middleware: [permission('as-served-sets', 'as-served-sets:browse')],
      handler: async ({ params: { asServedSetId }, query }) => {
        const asServedSet = await AsServedSet.findByPk(asServedSetId, { attributes: ['id'] });
        if (!asServedSet)
          throw new NotFoundError();

        const asServedImages = await AsServedImage.paginate({
          query,
          columns: ['id'],
          order: [['id', 'ASC']],
          where: { asServedSetId },
          include: ['image', 'thumbnailImage'],
          transform: responseCollection.asServedImageEntryResponse,
        });

        return { status: 200, body: asServedImages };
      },
    },
    store: {
      middleware: [
        permission('as-served-sets', 'as-served-sets:create'),
        upload.single('image'),
      ],
      handler: async ({ body: { label, weight }, file, params: { asServedSetId }, req }) => {
        const { userId } = req.scope.cradle.user;

        const res = imageMulterFile.safeParse(file);
        if (!res.success)
          throw ValidationError.from({ path: 'image', i18n: { type: 'file._' } });

        const asServedSet = await AsServedSet.findByPk(asServedSetId, { attributes: ['id'] });
        if (!asServedSet)
          throw new NotFoundError();

        let asServedImage = await req.scope.cradle.asServedService.createImage({
          id: asServedSetId,
          file: res.data,
          uploader: userId,
          label,
          weight,
        });
        asServedImage = await req.scope.cradle.portionSizeService.getAsServedImage(asServedSetId, asServedImage.id);

        return { status: 201, body: responseCollection.asServedImageEntryResponse(asServedImage) };
      },
    },
    destroyAll: {
      middleware: [permission('as-served-sets', 'as-served-sets:delete')],
      handler: async ({ params: { asServedSetId }, req }) => {
        await req.scope.cradle.asServedService.destroyImage(asServedSetId);

        return { status: 204, body: undefined };
      },
    },
    read: {
      middleware: [permission('as-served-sets', 'as-served-sets:read')],
      handler: async ({ params: { asServedSetId, asServedImageId }, req }) => {
        const asServedImage = await req.scope.cradle.portionSizeService.getAsServedImage(asServedSetId, asServedImageId);
        if (!asServedImage)
          throw new NotFoundError();

        return { status: 200, body: responseCollection.asServedImageEntryResponse(asServedImage) };
      },
    },
    destroy: {
      middleware: [permission('as-served-sets', 'as-served-sets:delete')],
      handler: async ({ params: { asServedSetId, asServedImageId }, req }) => {
        const result = await req.scope.cradle.asServedService.destroyImage(asServedSetId, asServedImageId);
        if (!result)
          throw new NotFoundError();

        return { status: 204, body: undefined };
      },
    },
  });
}
