import type { NextFunction, Request, Response, Router } from 'express';

import type { TokenPayload } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';

import { asValue } from 'awilix';
import passport from 'passport';

import { ForbiddenError } from '@intake24/api/http/errors';
import { surveyRespondent } from '@intake24/common/security';

export function isAalSatisfied(req: Request, res: Response, next: NextFunction): void {
  if (req.aal)
    next();
  else
    next(new ForbiddenError('Insufficient aal'));
}

/**
 * Verify authenticated user has verified the email address
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function isAccountVerified(req: Request, res: Response, next: NextFunction): void {
  if ((req.user as TokenPayload).verified)
    next();
  else
    next(new ForbiddenError('Account not verified'));
}

/*
 * This middleware should be placed after authentication
 * It assumes successfully authenticated user on request scope hence the assertion to User
 */
export function registerACLScope(req: Request, res: Response, next: NextFunction): void {
  req.scope.register({ user: asValue(req.user as TokenPayload) });

  next();
}

/**
 * Helper to register authentication and ACL scope middleware in routers
 */
export function authenticate(app: Router, type: FrontEnd): void {
  app.use(passport.authenticate(type, { session: false }));

  app.use(registerACLScope);
}

export function permission(...args: string[]) {
  return (req: Request<any, any, any, any, any>, res: Response, next: NextFunction): void => {
    req.scope.cradle.aclService.hasPermission(args).then(result => (result ? next() : next(new ForbiddenError()))).catch(err => next(err));
  };
}

export function anyPermission(...args: string[]) {
  return (req: Request<any, any, any, any, any>, res: Response, next: NextFunction): void => {
    req.scope.cradle.aclService.hasAnyPermission(args).then(result => (result ? next() : next(new ForbiddenError()))).catch(err => next(err));
  };
}

export function role(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.scope.cradle.aclService.hasRole(role).then(result => (result ? next() : next(new ForbiddenError()))).catch(err => next(err));
  };
}

export function isSurveyRespondent() {
  return (req: Request<{ slug: string }>, res: Response, next: NextFunction): void => {
    const { slug } = req.params;

    req.scope.cradle.aclService.hasPermission(surveyRespondent(slug)).then(result => (result ? next() : next(new ForbiddenError()))).catch(err => next(err));
  };
}
