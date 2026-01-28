import { Router } from 'express';

import { anyPermission } from '@intake24/api/http/middleware';

import local from './local';

export default () => {
  const router = Router();

  // TODO: set up dedicated resource permission name?
  router.use(anyPermission('locales', 'survey-schemes'));

  router.use('/local', local());

  return router;
};
