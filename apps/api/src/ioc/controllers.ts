import type { AwilixContainer } from 'awilix';
import { asFunction } from 'awilix';

import controllers from '@intake24/api/http/controllers';

export default (container: AwilixContainer): void => {
  container.register({
    // Admin
    adminCategoryController: asFunction(controllers.admin.fdbs.category),
    adminFoodController: asFunction(controllers.admin.fdbs.food),
    adminGlobalFoodsController: asFunction(controllers.admin.foods.globalFoods),
    adminLocalFoodsController: asFunction(controllers.admin.foods.localFoods),
    adminGlobalCategoriesController: asFunction(controllers.admin.categories.globalCategories),
    adminLocalCategoriesController: asFunction(controllers.admin.categories.localCategories),
    codeLookupController: asFunction(controllers.admin.codeLookup),

    // Images
    drinkScaleController: asFunction(controllers.admin.images.drinkScale),
  });
};
