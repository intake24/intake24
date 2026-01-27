import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import type { ValidationError } from 'express-validator';
import type { ValidationError as SequelizeValidationError, ValidationErrorItem } from 'sequelize';

import { HttpStatusCode } from 'axios';

import { ConflictError } from '@intake24/api/http/errors';

function toExpressValidationError(item: ValidationErrorItem): ValidationError {
  return {
    type: 'field',
    location: 'body',
    path: item.path ?? '',
    value: item.value,
    msg: item.message,
  };
}

// Convert Sequelize errors into a format compatible with express-validation
function toExpressValidationErrors(error: SequelizeValidationError) {
  const errors = Object.fromEntries(
    error.errors.map(sequelizeError => [
      sequelizeError.path ?? '$',
      toExpressValidationError(sequelizeError),
    ]),
  );

  return {
    errors,
    message: error.message,
  };
}

export const handleSequelizeErrors: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      res.status(HttpStatusCode.Conflict);
      res.json(toExpressValidationErrors(err as SequelizeValidationError));
      break;
    default:
      next(err);
  }
};

export async function translateSqlErrors<T>(action: () => Promise<T>) {
  try {
    return await action();
  }
  catch (e: any) {
    if (e.code === '23505')
      throw new ConflictError();
    else throw e;
  }
}
