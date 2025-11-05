import DrinkwareScale from './drinkware-scale';
import DrinkwareScaleV2 from './drinkware-scale-v2';
import DrinkwareSet from './drinkware-set';
import ImageMap from './image-map';

export function setupDrinkwareSetAssociations() {
  DrinkwareSet.belongsTo(ImageMap, {
    foreignKey: 'imageMapId',
    as: 'imageMap',
  });

  DrinkwareSet.hasMany(DrinkwareScale, {
    foreignKey: 'drinkwareSetId',
    as: 'scales',
  });

  DrinkwareSet.hasMany(DrinkwareScaleV2, {
    foreignKey: 'drinkwareSetId',
    as: 'scalesV2',
  });

  DrinkwareSet.addScope('scales', { include: [{ model: DrinkwareScale }] });
}
