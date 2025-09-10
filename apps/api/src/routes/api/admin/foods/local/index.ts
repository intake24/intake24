import { Router } from 'express';

import ioc from '@intake24/api/ioc';
import { wrapAsync } from '@intake24/api/util';

export default () => {
  const { adminLocalFoodsController } = ioc.cradle;
  const router = Router();

  router
    .route('/:localeId/enabled-foods')
    .get(wrapAsync(adminLocalFoodsController.readEnabledFoods));

  router.route('/:localeId').post(wrapAsync(adminLocalFoodsController.store));
  router.route('/:localeId/:foodId').get(wrapAsync(adminLocalFoodsController.read));

  return router;
};
