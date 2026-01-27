import type { Express } from 'express';

import passport from 'passport';

import { jwtStrategies } from '@intake24/api/services/core';

export default (app: Express): void => {
  app.use(passport.initialize());
  jwtStrategies(passport);
};
