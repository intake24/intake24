import DrinkwareScale from './drinkware-scale';
import DrinkwareSet from './drinkware-set';
import DrinkwareVolumeSample from './drinkware-volume-sample';

export function setupDrinkwareScaleAssociations() {
  DrinkwareScale.belongsTo(DrinkwareSet, {
    foreignKey: 'drinkwareSetId',
    as: 'drinkwareSet',
  });

  DrinkwareScale.hasMany(DrinkwareVolumeSample, {
    foreignKey: 'drinkwareScaleId',
    as: 'volumeSamples',
  });

  DrinkwareScale.addScope('drinkwareSet', { include: [{ model: DrinkwareSet }] });
  DrinkwareScale.addScope('volumeSamples', { include: [{ model: DrinkwareVolumeSample }] });
}
