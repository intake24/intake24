import type { Request, Response } from 'express';

import { Router } from 'express';

import { registerI18nScope, registerIoC } from '@intake24/api/http/middleware';
import { genericRateLimit } from '@intake24/api/http/rate-limit';
import { registerRouters } from '@intake24/api/http/routers';
import ioc from '@intake24/api/ioc';

import admin from './admin';

export default () => {
  const router = Router();

  router.use(registerIoC);
  router.use(registerI18nScope);
  const { rateLimiter, securityConfig: { jwt: { secret, issuer } } } = ioc.cradle;
  router.use(genericRateLimit(rateLimiter.bucket, { secret, issuer }));

  registerRouters(router);

  // Admin
  router.use('/admin', admin());

  router.all('{*rest}', (req: Request, res: Response): void => {
    res.status(404).json('Invalid route');
  });

  return router;
};
