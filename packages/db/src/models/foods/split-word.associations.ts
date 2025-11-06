import FoodsLocale from './locale';
import SplitWord from './split-word';

export function setupSplitWordAssociations() {
  SplitWord.belongsTo(FoodsLocale, { foreignKey: 'localeId' });
}
