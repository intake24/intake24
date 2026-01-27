import type { NextFunction, Request, Response } from 'express';

import { validationResult } from 'express-validator';

import { createExtendedValidationError, getValidationHttpStatus } from '@intake24/api/http/errors';

export default (req: Request, res: Response, next: NextFunction): void => {
  const { i18nService } = req.scope.cradle;

  const result = validationResult(req);
  const errors = result.formatWith(error => createExtendedValidationError(error, i18nService));

  if (errors.isEmpty()) {
    next();
    return;
  }

  const firstError = errors.array()[0];
  const status = getValidationHttpStatus(firstError);

  res.status(status).json({ errors: errors.mapped(), message: firstError.msg });
};
