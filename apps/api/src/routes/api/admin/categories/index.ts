import { Router } from 'express';

import { anyPermission } from '@intake24/api/http/middleware';
import validation from '@intake24/api/http/requests/admin/fdbs';
import ioc from '@intake24/api/ioc';
import { wrapAsync } from '@intake24/api/util';

import local from './local';

export default () => {
  const { adminCategoryController } = ioc.cradle;

  const router = Router();

  // TODO: set up dedicated resource permission name?
  router.use(anyPermission('locales', 'survey-schemes'));

  router.get('', validation.browse, wrapAsync(adminCategoryController.browseMain));

  router.use('/local', local());

  return router;
};
