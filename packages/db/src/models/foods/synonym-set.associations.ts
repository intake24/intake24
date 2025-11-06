import FoodsLocale from './locale';
import RecipeFood from './recipe-food';
import SynonymSet from './synonym-set';

export function setupSynonymSetAssociations() {
  SynonymSet.belongsTo(FoodsLocale, { foreignKey: 'localeId' });
  SynonymSet.hasMany(RecipeFood, { foreignKey: 'id' });
}
