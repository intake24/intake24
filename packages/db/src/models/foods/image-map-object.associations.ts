import ImageMap from './image-map';
import ImageMapObject from './image-map-object';
import ProcessedImage from './processed-image';

export function setupImageMapObjectAssociations() {
  ImageMapObject.belongsTo(ImageMap, {
    foreignKey: 'imageMapId',
    as: 'imageMap',
  });

  ImageMapObject.belongsTo(ProcessedImage, {
    foreignKey: 'overlayImageId',
    as: 'overlayImage',
  });
}
