import type { Express } from 'express';

import type { Ops } from '@intake24/api/app';

import { errors } from '@intake24/api/http/middleware';
import routes from '@intake24/api/routes';
import { trimStrings } from '@intake24/common/rules';

import authentication from './authentication';

export default (app: Express, ops: Ops) => {
  // Request sanitizers
  app.use((req, res, next) => {
    req.body = trimStrings(req.body);
    next();
  });

  // Mount authentication middleware
  authentication(app);

  // Mount routes
  routes(app, ops);

  // Mount error middleware
  errors(app, ops);
};
