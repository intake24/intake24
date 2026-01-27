import type { Express } from 'express';

import type { Ops } from '@intake24/api/app';

import { body, query } from 'express-validator';

import { errors } from '@intake24/api/http/middleware';
import routes from '@intake24/api/routes';
import { sanitize } from '@intake24/common/rules';

import authentication from './authentication';

export default (app: Express, ops: Ops) => {
  // Request sanitizers
  app.use(body('*').customSanitizer(val => sanitize(val, { allowHtml: true, emptyStringToNull: true })));
  app.use(query('*').customSanitizer(val => sanitize(val, { emptyStringToNull: true })));

  // Mount authentication middleware
  authentication(app);

  // Mount routes
  routes(app, ops);

  // Mount error middleware
  errors(app, ops);
};
