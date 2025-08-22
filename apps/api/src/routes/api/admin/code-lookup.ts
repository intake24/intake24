import { Router } from 'express';
import type { CodeLookupController } from '@intake24/api/http/controllers/admin/code-lookup.controller';
import { permission } from '@intake24/api/http/middleware/acl';
import ioc from '@intake24/api/ioc';

export default () => {
  const router = Router();
  const controller = ioc.cradle.codeLookupController as CodeLookupController;

  // Use fdbs:read permission to access these endpoints (same as global foods endpoints)
  const requireFoodsPermission = permission('fdbs:read');

  router.get('/:code', requireFoodsPermission, controller.lookup);
  router.post('/batch', requireFoodsPermission, controller.batchLookup);

  return router;
};
