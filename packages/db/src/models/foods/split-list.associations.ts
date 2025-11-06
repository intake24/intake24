import FoodsLocale from './locale';
import SplitList from './split-list';

export function setupSplitListAssociations() {
  SplitList.belongsTo(FoodsLocale, { foreignKey: 'localeId' });
}
