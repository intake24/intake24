import type { PaginateOptions } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { permission } from '@intake24/api/http/middleware';
import { localeResponse } from '@intake24/api/http/responses/admin';
import { contract } from '@intake24/common/contracts';
import { NutrientTable, securableScope, SystemLocale } from '@intake24/db';

export function foodDb() {
  return initServer().router(contract.admin.fdbs.foodDb, {
    browse: {
      middleware: [permission('locales')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions = {
          query,
          columns: ['code', 'englishName', 'localName'],
          order: [[fn('lower', col('code')), 'ASC']],
        };

        if (await aclService.hasPermission('locales:food-list')) {
          const locales = await SystemLocale.paginate(paginateOptions);
          return { status: 200, body: locales };
        }

        const locales = await SystemLocale.paginate({
          ...paginateOptions,
          where: { [Op.or]: { ownerId: userId, '$securables.action$': ['food-list'] } },
          ...securableScope(userId),
          subQuery: false,
        });

        return { status: 200, body: locales };
      },
    },
    refs: {
      middleware: [permission('locales')],
      handler: async () => {
        const nutrientTables = await NutrientTable.scope('list').findAll();

        return { status: 200, body: { nutrientTables } };
      },
    },
    read: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          where: { id: localeId },
        });

        return { status: 200, body: localeResponse(locale) };
      },
    },
  });
}
