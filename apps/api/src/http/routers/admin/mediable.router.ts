import type { MediableContract } from '@intake24/common/contracts/admin';
import type { FAQ, FeedbackScheme, ModelStatic, SurveyScheme } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import multer from 'multer';

import { ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import ioc from '@intake24/api/ioc';
import { isSecurableType } from '@intake24/common/security';
import { imageMulterFile } from '@intake24/common/types/http/admin';
import { modelToRequestParam, modelToResource } from '@intake24/common/util';

export function mediable(securable: ModelStatic<FAQ | FeedbackScheme | SurveyScheme>, contract: MediableContract) {
  const modelType = securable.name;
  if (!isSecurableType(modelType))
    throw new Error('Invalid securable type');

  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  const resource = modelToResource(modelType);
  const paramId = modelToRequestParam(modelType);

  return initServer().router(contract, {
    browse: {
      middleware: [permission(resource)],
      handler: async ({ query, req }) => {
        const { [paramId]: modelId } = req.params as Record<typeof paramId, string>;
        const { aclService, mediaService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'media', { attributes: ['id'], where: { id: modelId } });
        const media = await mediaService.browseMedia(query, { modelType, modelId });

        return { status: 200, body: media };
      },
    },
    store: {
      middleware: [permission(resource), upload.single('file')],
      handler: async ({ body, file, req }) => {
        const { [paramId]: modelId } = req.params as Record<typeof paramId, string>;
        const { aclService, kyselyDb, mediaService } = req.scope.cradle;

        if (body.id) {
          const dup = await kyselyDb.system.selectFrom('media').select('id').where('id', '=', body.id).executeTakeFirst();
          if (dup)
            throw ValidationError.from({ code: '$unique', path: 'id', i18n: { type: 'unique._' } });
        }

        await aclService.findAndCheckRecordAccess(securable, 'media', { attributes: ['id'], where: { id: modelId } });

        const { data, success } = imageMulterFile.safeParse(file);
        if (!success)
          throw ValidationError.from({ path: 'file', i18n: { type: 'file._' } });

        const media = await mediaService.createMedia({ ...body, modelType, modelId }, data);

        return { status: 201, body: media };
      },
    },
    read: {
      middleware: [permission(resource)],
      handler: async ({ params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: modelId, mediaId } = params;
        const { aclService, mediaService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'media', { attributes: ['id'], where: { id: modelId } });
        const media = await mediaService.getMedia({ id: mediaId, modelType, modelId });

        return { status: 200, body: media };
      },
    },
    update: {
      middleware: [permission(resource)],
      handler: async ({ body, params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: modelId, mediaId } = params;
        const { aclService, mediaService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'media', { attributes: ['id'], where: { id: modelId } });
        const media = await mediaService.updateMedia({ id: mediaId, modelType, modelId }, { ...body, modelType, modelId });

        return { status: 200, body: media };
      },
    },
    destroy: {
      middleware: [permission(resource)],
      handler: async ({ params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: modelId, mediaId } = params;
        const { aclService, mediaService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'media', { attributes: ['id'], where: { id: modelId } });
        await mediaService.destroyMedia({ id: mediaId, modelType, modelId });

        return { status: 204, body: undefined };
      },
    },
  });
}
