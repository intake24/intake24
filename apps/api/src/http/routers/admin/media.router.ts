import { initServer } from '@ts-rest/express';
import multer from 'multer';

import { ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { imageMulterFile } from '@intake24/common/types/http/admin';

export function media() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  return initServer().router(contract.admin.media, {
    browse: {
      middleware: [permission('media')],
      handler: async ({ query, req }) => {
        const { mediaService } = req.scope.cradle;

        const media = await mediaService.browseMedia(query);

        return { status: 200, body: media };
      },
    },
    store: {
      middleware: [permission('media', 'media:create'), upload.single('file')],
      handler: async ({ body, file, req }) => {
        const { mediaService, kyselyDb } = req.scope.cradle;

        if (body.id) {
          const dup = await kyselyDb.system.selectFrom('media').select('id').where('id', '=', body.id).executeTakeFirst();
          if (dup)
            throw ValidationError.from({ code: '$unique', path: 'id', i18n: { type: 'unique._' } });
        }

        const { data, success } = imageMulterFile.safeParse(file);
        if (!success)
          throw ValidationError.from({ path: 'file', i18n: { type: 'file._' } });

        const media = await mediaService.createMedia(body, data);

        return { status: 201, body: media };
      },
    },
    read: {
      middleware: [permission('media', 'media:read')],
      handler: async ({ params, req }) => {
        const { mediaId } = params;
        const { mediaService } = req.scope.cradle;

        const media = await mediaService.getMedia(mediaId);

        return { status: 200, body: media };
      },
    },
    update: {
      middleware: [permission('media', 'media:edit')],
      handler: async ({ body, params, req }) => {
        const { mediaId } = params;
        const { mediaService } = req.scope.cradle;

        const media = await mediaService.updateMedia(mediaId, body);

        return { status: 200, body: media };
      },
    },
    destroy: {
      middleware: [permission('media', 'media:delete')],
      handler: async ({ params, req }) => {
        const { mediaId } = params;
        const { mediaService } = req.scope.cradle;

        await mediaService.destroyMedia(mediaId);

        return { status: 204, body: undefined };
      },
    },
  });
}
