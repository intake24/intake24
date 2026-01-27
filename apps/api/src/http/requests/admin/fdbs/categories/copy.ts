import type { Request } from 'express';

import type { FindOptions } from '@intake24/db';

import { checkSchema } from 'express-validator';

import {
  customTypeErrorMessage,
  typeErrorMessage,
  validate,
} from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import { Category, SystemLocale } from '@intake24/db';

export default validate(
  checkSchema({
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
    code: {
      in: ['body'],
      errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 64 }),
      isString: { bail: true },
      isEmpty: { negated: true, bail: true },
      isLength: { options: { min: 1, max: 64 }, bail: true },
      custom: {
        options: async (value, meta): Promise<void> => {
          const { localeId } = (meta.req as Request).params;

          const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
          if (!locale)
            throw new Error(customTypeErrorMessage('unique._', meta));

          const options: FindOptions<Category> = { where: { localeId: locale.code } };

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
  }),
);
