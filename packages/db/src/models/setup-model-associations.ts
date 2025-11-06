import { setupFoodDbAssociations } from './foods/setup-food-db-associations';
import { setupSystemDbAssociations } from './system/setup-system-db-associations';

export const setupModelAssociations = {
  foods: setupFoodDbAssociations,
  system: setupSystemDbAssociations,
};
