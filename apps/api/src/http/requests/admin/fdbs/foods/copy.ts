import { checkSchema } from 'express-validator';

import {
  customTypeErrorMessage,
  typeErrorMessage,
  validate,
} from '@intake24/api/http/requests/util';
import { unique } from '@intake24/api/http/rules';
import type { FindOptions } from '@intake24/db';
import { Food, SystemLocale } from '@intake24/db';

export default validate(
  checkSchema({
    englishName: {
      in: ['body'],
      errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 128 }),
      isString: true,
      isEmpty: { negated: true },
      isLength: { options: { min: 1, max: 128 } },
      optional: true,
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
          const { localeId } = meta.req.body;

          const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
          if (!locale)
            throw new Error(customTypeErrorMessage('unique._', meta));

          const options: FindOptions<Food> = { where: { localeId: locale.code } };

          if (
            !(await unique({ model: Food, condition: { field: 'code', value }, options }))
          )
            throw new Error(customTypeErrorMessage('unique._', meta));
        },
      },
    },
    localeId: {
      in: ['body'],
      errorMessage: typeErrorMessage('string.minMax', { min: 1, max: 8 }),
      isString: { bail: true },
      isLength: { options: { min: 1, max: 8 }, bail: true },
    },
  }),
);
