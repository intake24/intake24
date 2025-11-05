// These functions setup circular associations and scopes separately from the model files to resolve
// circular dependencies between Sequelize models like, for example, AsServedImage and AsServedSet,
// which previously referenced each other directly via decorators.
// Each function is dedicated to a single model/table, defining its associations and scopes.

import { setupAsServedImageAssociations } from './as-served-image.associations';
import { setupAsServedSetAssociations } from './as-served-set.associations';
import { setupAssociatedFoodsAssociations } from './associated-foods.associations';
import { setupBrandAssociations } from './brand.associations';
import { setupCategoryAttributeAssociations } from './category-attributes.associations';
import { setupCategoryCategoryAssociations } from './category-category.associations';
import { setupCategoryPortionSizeMethodAssociations } from './category-portion-size-method.associations';
import { setupCategoryAssociations } from './category.associations';
import { setupDrinkwareScaleV2Associations } from './drinkware-scale-v2.associations';
import { setupDrinkwareScaleAssociations } from './drinkware-scale.associations';
import { setupDrinkwareSetAssociations } from './drinkware-set.associations';
import { setupDrinkwareVolumeSampleAssociations } from './drinkware-volume-sample.associations';
import { setupFoodCategoryAssociations } from './food-category.associations';
import { setupFoodAssociations } from './food.associations';

export default () => {
  console.log('BOBOBOBOBOBO');
  setupAsServedImageAssociations();
  setupAsServedSetAssociations();
  setupAssociatedFoodsAssociations();
  setupBrandAssociations();
  setupCategoryAssociations();
  setupCategoryAttributeAssociations();
  setupCategoryCategoryAssociations();
  setupCategoryPortionSizeMethodAssociations();
  setupFoodAssociations();
  setupFoodCategoryAssociations();
  setupDrinkwareScaleAssociations();
  setupDrinkwareScaleV2Associations();
  setupDrinkwareSetAssociations();
  setupDrinkwareVolumeSampleAssociations();
};
