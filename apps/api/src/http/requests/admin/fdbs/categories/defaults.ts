import type { Request } from 'express';
import type { Schema } from 'express-validator';

import type { FindOptions } from '@intake24/db';

import { customTypeErrorMessage, typeErrorMessage } from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import { Category, Op, SystemLocale } from '@intake24/db';

const defaults: Schema = {
  code: {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 64 }),
    isString: { bail: true },
    isEmpty: { negated: true, bail: true },
    isLength: { options: { min: 1, max: 64 }, bail: true },
    custom: {
      options: async (value, meta): Promise<void> => {
        const { localeId, categoryId } = (meta.req as Request).params;

        const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
        if (!locale)
          throw new Error(customTypeErrorMessage('unique._', meta));

        const options: FindOptions<Category> = {
          where: categoryId
            ? { localeId: locale.code, id: { [Op.ne]: categoryId } }
            : { localeId: locale.code },
        };

        if (
          !(await unique({
            model: Category,
            condition: { field: 'code', value },
            options,
          }))
        ) {
          throw new Error(customTypeErrorMessage('unique._', meta));
        }
      },
    },
  },
  englishName: {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 128 }),
    isString: true,
    isEmpty: { negated: true },
    isLength: { options: { min: 1, max: 128 } },
  },
  name: {
    in: ['body'],
    errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 256 }),
    isString: true,
    isEmpty: { negated: true },
    isLength: { options: { min: 1, max: 256 } },
  },
  hidden: {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._'),
    isBoolean: { options: { strict: true } },
  },
};

export default defaults;
