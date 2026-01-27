import type { ValidationMiddleware } from '@intake24/api/http/requests/util';

import { checkSchema } from 'express-validator';

import { typeErrorMessage, validate } from '@intake24/api/http/requests/util';

export default (param: string): ValidationMiddleware[] => {
  return validate(
    checkSchema({
      [param]: {
        in: ['params'],
        errorMessage: typeErrorMessage('string.max', { max: 64 }),
        isString: true,
        isLength: {
          options: {
            max: 64,
          },
        },
      },
    }),
  );
};
