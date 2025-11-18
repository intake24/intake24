import { Router } from 'express';

import validation from '@intake24/api/http/requests/admin/fdbs/categories';
import ioc from '@intake24/api/ioc';
import { wrapAsync } from '@intake24/api/util';

export default (options?: { byCode?: boolean }) => {
  const { adminCategoryController } = ioc.cradle;
  const router = Router({ mergeParams: true });

  const byCode = options?.byCode ?? false;

  if (byCode) {
    // Routes for locale code access
    router
      .route('')
      .post(validation.store, wrapAsync(adminCategoryController.storeByLocaleCode))
      .get(validation.browse, wrapAsync(adminCategoryController.browseByLocaleCode));

    router.get('/root', wrapAsync(adminCategoryController.rootByLocaleCode));

    router
      .route('/:categoryId')
      .get(wrapAsync(adminCategoryController.readByLocaleCode))
      .put(validation.update, wrapAsync(adminCategoryController.updateByLocaleCode))
      .delete(wrapAsync(adminCategoryController.destroyByLocaleCode));

    router.get('/:categoryId/categories', wrapAsync(adminCategoryController.categoriesByLocaleCode));
    router.get('/:categoryId/contents', wrapAsync(adminCategoryController.contentsByLocaleCode));
    router.post('/:categoryId/copy', validation.copy, wrapAsync(adminCategoryController.copyByLocaleCode));
  }
  else {
    // Routes for numeric locale ID access (admin UI)
    router
      .route('')
      .post(validation.store, wrapAsync(adminCategoryController.store))
      .get(validation.browse, wrapAsync(adminCategoryController.browse));

    router.get('/root', wrapAsync(adminCategoryController.root));

    router
      .route('/:categoryId')
      .get(wrapAsync(adminCategoryController.read))
      .put(validation.update, wrapAsync(adminCategoryController.update))
      .delete(wrapAsync(adminCategoryController.destroy));

    router.get('/:categoryId/categories', wrapAsync(adminCategoryController.categories));
    router.get('/:categoryId/contents', wrapAsync(adminCategoryController.contents));
    router.post('/:categoryId/copy', validation.copy, wrapAsync(adminCategoryController.copy));
  }

  return router;
};
