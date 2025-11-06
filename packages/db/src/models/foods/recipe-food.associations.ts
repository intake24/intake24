import FoodsLocale from './locale';
import RecipeFood from './recipe-food';
import RecipeFoodStep from './recipe-food-step';
import SynonymSet from './synonym-set';

export function setupRecipeFoodAssociations() {
  RecipeFood.addScope('list', {
    attributes: ['id', 'code', 'name', 'localeId', 'recipeWord', 'synonyms'],
    order: [['name', 'ASC']],
  });
  RecipeFood.addScope('steps', { include: [{ model: RecipeFoodStep }] });
  RecipeFood.addScope('synonyms', { include: [{ model: SynonymSet }] });
  RecipeFood.belongsTo(FoodsLocale, { foreignKey: 'localeId' });
  RecipeFood.belongsTo(SynonymSet, { foreignKey: 'synonymsId' });
  RecipeFood.hasMany(RecipeFoodStep, { foreignKey: 'recipeFoodsId' });
}
