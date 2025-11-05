import setupFoodDbAssociations from './foods/setup-food-db-associations';
import finaliseSystemDbModels from './system/finalise-system-db-models';

export const setupModelAssociations = {
  foods: setupFoodDbAssociations,
  system: finaliseSystemDbModels,
};
