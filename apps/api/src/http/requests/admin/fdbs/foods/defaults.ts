import type { Request } from 'express';
import type { Schema } from 'express-validator';

import { customTypeErrorMessage, typeErrorMessage } from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import type { FindOptions } from '@intake24/db';
import { FoodGroup, FoodLocal, Op, SystemLocale } from '@intake24/db';

const defaults: Schema = {
  name: {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 256 }),
    isString: true,
    isEmpty: { negated: true },
    isLength: { options: { min: 1, max: 256 } },
  },
  'main.name': {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 128 }),
    isString: true,
    isEmpty: { negated: true },
    isLength: { options: { min: 1, max: 128 } },
    optional: true,
  },
  'main.code': {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 32 }),
    isString: { bail: true },
    isEmpty: { negated: true, bail: true },
    isLength: { options: { min: 1, max: 32 }, bail: true },
    optional: true,
    custom: {
      options: async (value, meta): Promise<void> => {
        const { localeId, foodId } = (meta.req as Request).params;

        const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
        if (!locale)
          throw new Error(customTypeErrorMessage('unique._', meta));

        const options: FindOptions<FoodLocal> = {
          where: foodId
            ? { localeId: locale.code, id: { [Op.ne]: foodId } }
            : { localeId: locale.code },
          include: [{ association: 'main', attributes: [], required: true }],
        };

        if (!(await unique({ model: FoodLocal, condition: { field: 'foodCode', value }, options })))
          throw new Error(customTypeErrorMessage('unique._', meta));
      },
    },
  },
  'main.foodGroupId': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._'),
    isString: { bail: true },
    isEmpty: { negated: true, bail: true },
    optional: true,
    custom: {
      options: async (value, meta): Promise<void> => {
        const foodGroup = await FoodGroup.findByPk(value, { attributes: ['id'] });
        if (!foodGroup)
          throw new Error(customTypeErrorMessage('exists._', meta));
      },
    },
  },
};

export default defaults;
