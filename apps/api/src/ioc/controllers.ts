import type { AwilixContainer } from 'awilix';

import { asFunction } from 'awilix';

import controllers from '@intake24/api/http/controllers';

export default (container: AwilixContainer): void => {
  container.register({
    // Admin
    adminCategoryController: asFunction(controllers.admin.fdbs.category),
    adminFoodController: asFunction(controllers.admin.fdbs.food),
    adminLocalFoodsController: asFunction(controllers.admin.foods.localFoods),
    adminLocalCategoriesController: asFunction(controllers.admin.categories.localCategories),

    // Images
    drinkScaleController: asFunction(controllers.admin.images.drinkScale),
  });
};
