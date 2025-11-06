// These functions setup circular associations and scopes separately from the model files to resolve
// circular dependencies between Sequelize models like, for example, AsServedImage and AsServedSet,
// which previously referenced each other directly via decorators.

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
import { setupFoodNutrientAssociations } from './food-nutrients.associations';
import { setupFoodThumbnailImageAssociations } from './food-thumbnail-image.associations';
import { setupFoodAssociations } from './food.associations';
import { setupGuideImageObjectAssociations } from './guide-image-object.associations';
import { setupGuideImageAssociations } from './guide-image.associations';
import { setupImageMapObjectAssociations } from './image-map-object.associations';
import { setupImageMapAssociations } from './image-map.associations';
import { setupLocaleAssociations } from './locale.associations';
import { setupNutrientTableCsvMappingFieldAssociations } from './nutrient-table-csv-mapping-field.associations';
import { setupNutrientTableCsvMappingNutrientAssociations } from './nutrient-table-csv-mapping-nutrient.associations';
import { setupNutrientTableAssociations } from './nutrient-table.associations';
import { setupNutrientTypeInKcalAssociations } from './nutrient-type-in-kcal.associations';
import { setupNutrientTypeAssociations } from './nutrient-type.associations';
import { setupNutrientUnitAssociations } from './nutrient-unit.associations';
import { setupProcessedImageAssociations } from './processed-image.associations';
import { setupRecipeFoodStepAssociations } from './recipe-food-step.associations';
import { setupRecipeFoodAssociations } from './recipe-food.associations';
import { setupSourceImageKeywordAssociations } from './source-image-keyword.associations';
import { setupSourceImageAssociations } from './source-image.associations';
import { setupSplitListAssociations } from './split-list.associations';
import { setupSplitWordAssociations } from './split-word.associations';
import { setupSynonymSetAssociations } from './synonym-set.associations';

export function setupFoodDbAssociations() {
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

  setupFoodNutrientAssociations();
  setupGuideImageAssociations();
  setupGuideImageObjectAssociations();
  setupImageMapAssociations();
  setupImageMapObjectAssociations();
  setupFoodThumbnailImageAssociations();
  setupProcessedImageAssociations();
  setupLocaleAssociations();
  setupSynonymSetAssociations();
  setupSplitWordAssociations();
  setupSplitListAssociations();

  setupNutrientTableAssociations();
  setupNutrientTableCsvMappingNutrientAssociations();
  setupNutrientTableCsvMappingFieldAssociations();
  setupNutrientTypeAssociations();
  setupNutrientTypeInKcalAssociations();
  setupNutrientUnitAssociations();

  setupSourceImageAssociations();
  setupSourceImageKeywordAssociations();

  setupRecipeFoodAssociations();
  setupRecipeFoodStepAssociations();
};
