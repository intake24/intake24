import type { Express } from 'express';

import type { Ops } from '@intake24/api/app';

import { body } from 'express-validator';

import { errors } from '@intake24/api/http/middleware';
import routes from '@intake24/api/routes';
import { trimStrings } from '@intake24/common/rules';

import authentication from './authentication';

export default (app: Express, ops: Ops) => {
  // Request sanitizers
  app.use(body('*').customSanitizer(val => trimStrings(val)));

  // Mount authentication middleware
  authentication(app);

  // Mount routes
  routes(app, ops);

  // Mount error middleware
  errors(app, ops);
};
