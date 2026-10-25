import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { col, fn, literal, Op, where } from 'sequelize';

import { ForbiddenError, NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import {
  Category,
  CategoryPortionSizeMethod,
  Food,
  FoodPortionSizeMethod,
  StandardUnit,
  SystemLocale,
} from '@intake24/db';

async function getLocaleMap(code: string[]) {
  if (!code.length)
    return {};

  const locales = await SystemLocale.findAll({ attributes: ['id', 'code'], where: { code } });
  return locales.reduce<Record<string, string>>((acc, locale) => {
    acc[locale.code] = locale.id;
    return acc;
  }, {});
}

async function uniqueMiddleware(value: any, { localeId, standardUnitId }: { localeId: string; standardUnitId?: string }) {
  const where: WhereOptions = standardUnitId ? { localeId, id: { [Op.ne]: standardUnitId } } : { localeId };

  if (!(await unique({ model: StandardUnit, condition: { field: 'code', value }, options: { where } }))) {
    throw ValidationError.from({ path: 'code', i18n: { type: 'unique._' } });
  }
}

export function standardUnit() {
  return initServer().router(contract.admin.locale.standardUnit, {
    browse: {
      middleware: [permission('locales')],
      handler: async ({ query, params: { localeId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const standardUnits = await StandardUnit.paginate({
          query,
          where: { localeId: locale.code },
          columns: ['code', 'name'],
          order: [[fn('lower', col('code')), 'ASC']],
        });

        return { status: 200, body: standardUnits };
      },
    },
    store: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        await uniqueMiddleware(body.code, { localeId: locale.code });

        const standardUnit = await StandardUnit.create({ ...body, localeId: locale.code });

        return { status: 201, body: standardUnit };
      },
    },
    read: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId, standardUnitId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const standardUnit = await StandardUnit.findOne({ where: { id: standardUnitId, localeId: locale.code } });
        if (!standardUnit)
          throw new NotFoundError();

        return { status: 200, body: standardUnit };
      },
    },
    update: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId, standardUnitId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        await uniqueMiddleware(body.code, { localeId: locale.code, standardUnitId });

        const standardUnit = await StandardUnit.findOne({ where: { id: standardUnitId, localeId: locale.code } });
        if (!standardUnit)
          throw new NotFoundError();

        await standardUnit.update(body);

        return { status: 200, body: standardUnit };
      },
    },
    destroy: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId, standardUnitId }, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const standardUnit = await StandardUnit.findOne({ where: { id: standardUnitId, localeId: locale.code } });
        if (!standardUnit)
          throw new NotFoundError();

        const [categoryPsm, foodPsm] = await Promise.all([
          CategoryPortionSizeMethod.findOne({
            attributes: ['id'],
            include: [{ association: 'category', where: { localeId } }],
            where: where(
              literal(`parameters`),
              '@>',
              `{"units":[{"name": "${standardUnit.code}"}]}`,
            ),
          }),
          FoodPortionSizeMethod.findOne({
            attributes: ['id'],
            include: [{ association: 'food', where: { localeId } }],
            where: where(
              literal(`parameters`),
              '@>',
              `{"units":[{"name": "${standardUnit.code}"}]}`,
            ),
          }),
        ]);

        if (categoryPsm || foodPsm) {
          throw new ForbiddenError(
            'Standard unit cannot be deleted. There are categories/foods using this standard unit.',
          );
        }

        await standardUnit.destroy();

        return { status: 204, body: undefined };
      },
    },
    categories: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId, standardUnitId }, query, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const standardUnit = await StandardUnit.findOne({ where: { id: standardUnitId, localeId: locale.code } });
        if (!standardUnit)
          throw new NotFoundError();

        const categories = await Category.paginate({
          query,
          columns: ['id', 'code', 'name'],
          subQuery: false,
          include: [
            {
              association: 'portionSizeMethods',
              attributes: ['id'],
              where: where(
                literal(`parameters`),
                '@>',
                `{"units":[{"name": "${standardUnit.code}"}]}`,
              ),
              required: true,
            },
          ],
          order: [['code', 'ASC']],
        });

        const localeMap = await getLocaleMap([
          ...new Set(categories.data.map(({ localeId }) => localeId)),
        ]);

        categories.data = categories.data.map(item => ({
          ...item.get(),
          localeCode: item.localeId,
          localeId: localeMap[item.localeId],
        }));

        return { status: 200, body: categories };
      },
    },
    foods: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId, standardUnitId }, query, req }) => {
        const { aclService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'standard-units', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const standardUnit = await StandardUnit.findOne({ where: { id: standardUnitId, localeId: locale.code } });
        if (!standardUnit)
          throw new NotFoundError();

        const foods = await Food.paginate({
          query,
          columns: ['id', 'code', 'name'],
          subQuery: false,
          include: [
            {
              association: 'portionSizeMethods',
              attributes: ['id'],
              where: where(
                literal(`parameters`),
                '@>',
                `{"units":[{"name": "${standardUnit.code}"}]}`,
              ),
              required: true,
            },
          ],
          order: [['code', 'ASC']],
        });

        const localeMap = await getLocaleMap([
          ...new Set(foods.data.map(({ localeId }) => localeId)),
        ]);

        foods.data = foods.data.map(item => ({
          ...item.get(),
          localeCode: item.localeId,
          localeId: localeMap[item.localeId],
        }));

        return { status: 200, body: foods };
      },
    },
  });
}
