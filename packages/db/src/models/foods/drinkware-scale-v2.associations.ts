import DrinkwareScaleV2 from './drinkware-scale-v2';
import DrinkwareSet from './drinkware-set';
import ProcessedImage from './processed-image';

export function setupDrinkwareScaleV2Associations() {
  DrinkwareScaleV2.belongsTo(DrinkwareSet, {
    foreignKey: 'drinkwareSetId',
    as: 'drinkwareSet',
  });

  DrinkwareScaleV2.belongsTo(ProcessedImage, {
    foreignKey: 'baseImageId',
    as: 'baseImage',
  });

  DrinkwareScaleV2.addScope('drinkwareSet', { include: [{ model: DrinkwareSet }] });
}
