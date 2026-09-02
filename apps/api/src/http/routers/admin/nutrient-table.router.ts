import { initServer } from '@ts-rest/express';
import multer from 'multer';
import { col, fn } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { requireCsvUploadPath } from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { jobRequiresFile } from '@intake24/common/types';
import { FoodsNutrientType, NutrientTable } from '@intake24/db';

async function uniqueMiddleware(value: string) {
  if (!(await unique({ model: NutrientTable, condition: { field: 'id', value } }))) {
    throw ValidationError.from({ path: 'id', i18n: { type: 'unique._' } });
  }
}

export function nutrientTable() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  return initServer().router(contract.admin.nutrientTable, {
    browse: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:browse')],
      handler: async ({ query }) => {
        const nutrientTables = await NutrientTable.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('id')), 'ASC']],
        });

        return { status: 200, body: nutrientTables };
      },
    },
    store: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.id);

        const nutrientTable = await req.scope.cradle.nutrientTableService.createTable(body);

        return { status: 201, body: nutrientTable };
      },
    },
    refs: {
      middleware: [permission('nutrient-tables')],
      handler: async () => {
        const nutrientTypes = await FoodsNutrientType.scope('list').findAll();

        return { status: 200, body: { nutrientTypes } };
      },
    },
    read: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:read')],
      handler: async ({ params: { nutrientTableId }, req }) => {
        const nutrientTable = await req.scope.cradle.nutrientTableService.getTable(nutrientTableId);

        return { status: 200, body: nutrientTable };
      },
    },
    update: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:edit')],
      handler: async ({ body, params: { nutrientTableId }, req }) => {
        const nutrientTable = await req.scope.cradle.nutrientTableService.updateTable(
          nutrientTableId,
          body,
        );

        return { status: 200, body: nutrientTable };
      },
    },
    destroy: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:delete')],
      handler: async ({ params: { nutrientTableId }, req }) => {
        await req.scope.cradle.nutrientTableService.deleteTable(nutrientTableId);

        return { status: 204, body: undefined };
      },
    },
    tasks: {
      middleware: [
        permission('nutrient-tables', 'nutrient-tables:tasks'),
        upload.single('params[file]'),
      ],
      handler: async ({ file, params: { nutrientTableId }, body: { params, type }, req }) => {
        const { userId } = req.scope.cradle.user;

        const taskParams = { ...params, nutrientTableId };
        if (jobRequiresFile(type)) {
          // @ts-expect-error not narrowed yet
          taskParams.file = requireCsvUploadPath(file);
        }

        const nutrientTable = await NutrientTable.findByPk(nutrientTableId, { attributes: ['id'] });
        if (!nutrientTable)
          throw new NotFoundError();

        const job = await req.scope.cradle.nutrientTableService.queueTask({
          userId,
          type,
          params: taskParams,
        });

        return { status: 200, body: job };
      },
    },
    records: {
      middleware: [permission('nutrient-tables', 'nutrient-tables:edit')],
      handler: async ({ body: { records }, params: { nutrientTableId }, req }) => {
        await req.scope.cradle.nutrientTableService.updateRecords(nutrientTableId, records);

        return { status: 200, body: undefined };
      },
    },
  });
}
