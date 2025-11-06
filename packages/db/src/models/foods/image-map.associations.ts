import DrinkwareSet from './drinkware-set';
import GuideImage from './guide-image';
import ImageMap from './image-map';
import ImageMapObject from './image-map-object';
import ProcessedImage from './processed-image';

export function setupImageMapAssociations() {
  ImageMap.belongsTo(ProcessedImage, {
    foreignKey: 'baseImageId',
    as: 'baseImage',
  });

  ImageMap.hasMany(DrinkwareSet, {
    foreignKey: 'imageMapId',
    as: 'drinkwareSets',
  });

  ImageMap.hasMany(GuideImage, {
    foreignKey: 'imageMapId',
    as: 'guideImages',
  });

  ImageMap.hasMany(ImageMapObject, {
    foreignKey: 'imageMapId',
    as: 'objects',
  });

  ImageMap.addScope('guideImages', { include: [{ model: GuideImage }] });
  ImageMap.addScope('baseImage', { include: [{ model: ProcessedImage }] });
  ImageMap.addScope('objects', { include: [{ model: ImageMapObject }] });
}
