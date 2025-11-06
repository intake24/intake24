import FoodsLocale from './locale';
import RecipeFood from './recipe-food';
import RecipeFoodStep from './recipe-food-step';

export function setupRecipeFoodStepAssociations() {
  RecipeFoodStep.addScope('list', {
    attributes: [
      'id',
      'recipeFoodsId',
      'code',
      'order',
      'name',
      'description',
      'repeatable',
      'required',
    ],
    order: [['order', 'ASC']],
  });
  RecipeFoodStep.belongsTo(RecipeFood, { foreignKey: 'recipeFoodsId' });
  RecipeFoodStep.belongsTo(FoodsLocale, { foreignKey: 'localeId' });
}
