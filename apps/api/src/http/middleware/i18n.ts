import type { NextFunction, Request, Response } from 'express';

import { asValue } from 'awilix';
import Negotiator from 'negotiator';

/*
 * Register client language preferences
 */
export function registerI18nScope(req: Request, res: Response, next: NextFunction): void {
  const negotiator = new Negotiator(req);

  req.scope.register({
    clientLanguages: asValue(negotiator.languages()),
  });

  next();
}
