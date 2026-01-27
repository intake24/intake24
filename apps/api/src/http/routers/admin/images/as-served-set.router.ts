import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import multer from 'multer';
import { col, fn, Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { imageResponseCollection } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { imageMulterFile } from '@intake24/common/types/http/admin';
import { AsServedSet } from '@intake24/db';

async function uniqueMiddleware(value: any, { asServedSetId }: { asServedSetId?: string } = {}) {
  const where: WhereOptions = asServedSetId ? { id: { [Op.ne]: asServedSetId } } : {};

  if (!(await unique({ model: AsServedSet, condition: { field: 'id', value }, options: { where } }))) {
    throw ValidationError.from({ code: '$unique', path: 'id', i18n: { type: 'unique._' } });
  }
}

export function asServedSet() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });
  const responseCollection = imageResponseCollection(ioc.cradle.imagesBaseUrl);

  return initServer().router(contract.admin.images.asServedSet, {
    browse: {
      middleware: [permission('as-served-sets', 'as-served-sets:browse')],
      handler: async ({ query }) => {
        const asServedSets = await AsServedSet.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('AsServedSet.id')), 'ASC']],
          include: ['selectionImage'],
          transform: responseCollection.asServedSetListResponse,
        });

        return { status: 200, body: asServedSets };
      },
    },
    store: {
      middleware: [
        permission('as-served-sets', 'as-served-sets:create'),
        upload.single('selectionImage'),
      ],
      handler: async ({ body, file, req }) => {
        await uniqueMiddleware(body.id);

        const { userId } = req.scope.cradle.user;

        const res = imageMulterFile.safeParse(file);
        if (!res.success)
          throw ValidationError.from({ path: 'selectionImage', i18n: { type: 'file._' } });

        let asServedSet = await req.scope.cradle.asServedService.createSet({ ...body, file: res.data, uploader: userId });
        asServedSet = await req.scope.cradle.portionSizeService.getAsServedSet(asServedSet.id);

        return { status: 201, body: responseCollection.asServedSetEntryResponse(asServedSet) };
      },
    },
    read: {
      middleware: [permission('as-served-sets', 'as-served-sets:read')],
      handler: async ({ params: { asServedSetId }, req }) => {
        const asServedSet = await req.scope.cradle.portionSizeService.getAsServedSet(asServedSetId);
        if (!asServedSet)
          throw new NotFoundError();

        return { status: 200, body: responseCollection.asServedSetEntryResponse(asServedSet) };
      },
    },
    update: {
      middleware: [permission('as-served-sets', 'as-served-sets:edit')],
      handler: async ({ body, params: { asServedSetId }, req }) => {
        const asServedSet = await req.scope.cradle.asServedService.updateSet(asServedSetId, body);

        return { status: 200, body: responseCollection.asServedSetEntryResponse(asServedSet) };
      },
    },
    destroy: {
      middleware: [permission('as-served-sets', 'as-served-sets:delete')],
      handler: async ({ params: { asServedSetId }, req }) => {
        await req.scope.cradle.asServedService.destroySet(asServedSetId);

        return { status: 204, body: undefined };
      },
    },
  });
}
