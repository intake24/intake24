import type { Request } from 'express';
import { checkSchema } from 'express-validator';

import {
  customTypeErrorMessage,
  typeErrorMessage,
  validate,
} from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import type { FindOptions } from '@intake24/db';
import { FoodGroup, FoodLocal, SystemLocale } from '@intake24/db';

import { categories } from '../common';

export default validate(
  checkSchema({
    name: {
      in: ['body'],
      errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 128 }),
      isString: true,
      isEmpty: { negated: true },
      isLength: { options: { min: 1, max: 128 } },
    },
    code: {
      in: ['body'],
      errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 32 }),
      isString: { bail: true },
      isEmpty: { negated: true, bail: true },
      isLength: { options: { min: 1, max: 32 }, bail: true },
      custom: {
        options: async (value, meta): Promise<void> => {
          const { localeId } = (meta.req as Request).params;

          const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
          if (!locale)
            throw new Error(customTypeErrorMessage('unique._', meta));

          const options: FindOptions<FoodLocal> = {
            where: { localeId: locale.code },
            include: [{ association: 'main', attributes: [], required: true }],
          };

          if (
            !(await unique({ model: FoodLocal, condition: { field: 'foodCode', value }, options }))
          )
            throw new Error(customTypeErrorMessage('unique._', meta));
        },
      },
    },
    foodGroupId: {
      in: ['body'],
      errorMessage: typeErrorMessage('string._'),
      isString: { bail: true },
      isEmpty: { negated: true, bail: true },
      custom: {
        options: async (value, meta): Promise<void> => {
          const foodGroup = await FoodGroup.findByPk(value, { attributes: ['id'] });
          if (!foodGroup)
            throw new Error(customTypeErrorMessage('exists._', meta));
        },
      },
    },
    parentCategories: categories,
  }),
);
