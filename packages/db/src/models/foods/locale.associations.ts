import Category from './category';
import Food from './food';
import Locale from './locale';
import SplitList from './split-list';
import SplitWord from './split-word';
import SynonymSet from './synonym-set';

export function setupLocaleAssociations() {
  Locale.hasMany(Category, { foreignKey: 'localeId' });
  Locale.hasMany(Food, { foreignKey: 'localeId' });
  Locale.hasMany(SplitList, { foreignKey: 'localeId' });
  Locale.hasMany(SplitWord, { foreignKey: 'localeId' });
  Locale.hasMany(SynonymSet, { foreignKey: 'localeId' });
}
