import type { WhereOptions } from 'sequelize';

import type { ImageMulterFile } from '@intake24/common/types/http/admin';

import { initServer } from '@ts-rest/express';
import multer from 'multer';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { imageMulterFile } from '@intake24/common/types/http/admin';
import { DrinkwareSet, ImageMap } from '@intake24/db';

async function uniqueMiddleware(value: any, { drinkwareSetId }: { drinkwareSetId?: string } = {}) {
  const where: WhereOptions = drinkwareSetId ? { id: { [Op.ne]: drinkwareSetId } } : {};

  if (!(await unique({ model: DrinkwareSet, condition: { field: 'id', value }, options: { where } }))) {
    throw ValidationError.from({ code: '$unique', path: 'id', i18n: { type: 'unique._' } });
  }
}

async function dataCheck(imageMapId: string) {
  const imageMap = await ImageMap.findByPk(imageMapId, { attributes: ['id'] });

  if (!imageMap)
    throw ValidationError.from({ path: 'imageMapId', i18n: { type: 'exists._' } });
}

export function drinkwareSet() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  return initServer().router(contract.admin.images.drinkwareSet, {
    browse: {
      middleware: [permission('drinkware-sets', 'drinkware-sets:browse')],
      handler: async ({ query, req }) => {
        const drinkwareSets = await req.scope.cradle.drinkwareSetService.getDrinkwareSets(query);

        return { status: 200, body: drinkwareSets };
      },
    },
    store: {
      middleware: [permission('drinkware-sets', 'drinkware-sets:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.id);
        await dataCheck(body.imageMapId);

        await req.scope.cradle.drinkwareSetService.create(body);

        const drinkwareSetEntry = await req.scope.cradle.drinkwareSetService.getDrinkwareSetOrThrow(body.id);

        return { status: 201, body: drinkwareSetEntry };
      },
    },
    read: {
      middleware: [permission('drinkware-sets', 'drinkware-sets:read')],
      handler: async ({ params: { drinkwareSetId }, req }) => {
        const drinkwareSet = await req.scope.cradle.drinkwareSetService.getDrinkwareSet(drinkwareSetId);
        if (!drinkwareSet)
          throw new NotFoundError();

        return { status: 200, body: drinkwareSet };
      },
    },
    update: {
      middleware: [
        permission('drinkware-sets', 'drinkware-sets:edit'),
        upload.any(),
      ],
      handler: async ({ body, files, params: { drinkwareSetId }, req }) => {
        const { userId } = req.scope.cradle.user;

        const res = imageMulterFile.array().safeParse(files);
        if (!res.success)
          throw ValidationError.from({ path: 'baseImage', i18n: { type: 'file._' } });

        const fileKeyRegex = /^baseImage\[choiceId-(?<choiceId>\d)+\]$/i;
        const baseImageFiles: Record<string, ImageMulterFile> = {};

        for (const file of res.data) {
          const { fieldname } = file;
          const { choiceId } = fieldname.match(fileKeyRegex)?.groups || {};

          if (!choiceId)
            throw ValidationError.from({ path: fieldname, i18n: { type: 'regEx._' } });

          if (baseImageFiles[choiceId] !== undefined)
            throw ValidationError.from({ path: fieldname, i18n: { type: 'duplicate._' } });

          baseImageFiles[choiceId] = file;
        }

        await req.scope.cradle.drinkwareSetService.update(drinkwareSetId, userId, { ...body, baseImageFiles });

        const updated = await req.scope.cradle.drinkwareSetService.getDrinkwareSetOrThrow(drinkwareSetId);

        return { status: 200, body: updated };
      },
    },
    destroy: {
      middleware: [permission('drinkware-sets', 'drinkware-sets:delete')],
      handler: async ({ params: { drinkwareSetId } }) => {
        const drinkwareSet = await DrinkwareSet.findByPk(drinkwareSetId, { attributes: ['id'] });
        if (!drinkwareSet)
          throw new NotFoundError();

        await drinkwareSet.destroy();

        return { status: 204, body: undefined };
      },
    },
  });
}
