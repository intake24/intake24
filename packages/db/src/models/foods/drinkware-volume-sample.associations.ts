import DrinkwareScale from './drinkware-scale';
import DrinkwareVolumeSample from './drinkware-volume-sample';

export function setupDrinkwareVolumeSampleAssociations() {
  DrinkwareVolumeSample.belongsTo(DrinkwareScale, {
    foreignKey: 'drinkwareScaleId',
    as: 'scale',
  });

  DrinkwareVolumeSample.addScope('scale', { include: [{ model: DrinkwareScale }] });
}
