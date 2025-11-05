import Brand from './brand';
import Food from './food';

export function setupBrandAssociations() {
  Brand.belongsTo(Food, {
    foreignKey: 'foodId',
    as: 'food',
  });
}
