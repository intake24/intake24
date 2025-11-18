import { Router } from 'express';

import validation from '@intake24/api/http/requests/admin/fdbs/foods';
import ioc from '@intake24/api/ioc';
import { wrapAsync } from '@intake24/api/util';

export default (options?: { byCode?: boolean }) => {
  const { adminFoodController } = ioc.cradle;
  const router = Router({ mergeParams: true });

  const byCode = options?.byCode ?? false;

  if (byCode) {
    // Routes for locale code access
    router
      .route('')
      .post(validation.store, wrapAsync(adminFoodController.storeByLocaleCode))
      .get(validation.browse, wrapAsync(adminFoodController.browseByLocaleCode));

    router
      .route('/by-code/:foodCode')
      .get(wrapAsync(adminFoodController.readByCodeAndLocaleCode));

    router
      .route('/:foodId')
      .get(wrapAsync(adminFoodController.readByLocaleCode))
      .put(validation.update, wrapAsync(adminFoodController.updateByLocaleCode))
      .delete(wrapAsync(adminFoodController.destroyByLocaleCode));

    router.get('/:foodId/categories', wrapAsync(adminFoodController.categoriesByLocaleCode));
    router.post('/:foodId/copy', validation.copy, wrapAsync(adminFoodController.copyByLocaleCode));
  }
  else {
    // Routes for numeric locale ID access (admin UI)
    router
      .route('')
      .post(validation.store, wrapAsync(adminFoodController.store))
      .get(validation.browse, wrapAsync(adminFoodController.browse));

    // This is not very elegant because /by-code potentially clashes with /:foodId, but
    // since food ids are numbers this is fine
    router
      .route('/by-code/:foodCode')
      .get(wrapAsync(adminFoodController.readByCode));

    router
      .route('/:foodId')
      .get(wrapAsync(adminFoodController.read))
      .put(validation.update, wrapAsync(adminFoodController.update))
      .delete(wrapAsync(adminFoodController.destroy));

    router.get('/:foodId/categories', wrapAsync(adminFoodController.categories));
    router.post('/:foodId/copy', validation.copy, wrapAsync(adminFoodController.copy));
  }

  return router;
};
