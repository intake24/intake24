import AsServedImage from './as-served-image';
import AsServedSet from './as-served-set';
import FoodThumbnailImage from './food-thumbnail-image';
import ImageMap from './image-map';
import ProcessedImage from './processed-image';
import SourceImage from './source-image';

export function setupProcessedImageAssociations() {
  ProcessedImage.belongsTo(SourceImage, {
    foreignKey: 'sourceId',
    as: 'sourceImage',
  });

  ProcessedImage.hasMany(AsServedSet, {
    foreignKey: 'selectionImageId',
    as: 'asServedSets',
  });

  ProcessedImage.hasMany(AsServedImage, {
    foreignKey: 'imageId',
    as: 'asServedImages',
  });

  ProcessedImage.hasMany(AsServedImage, {
    foreignKey: 'thumbnailImageId',
    as: 'asServedThumbnailImages',
  });

  ProcessedImage.hasMany(ImageMap, {
    foreignKey: 'baseImageId',
    as: 'imageMaps',
  });

  ProcessedImage.hasMany(FoodThumbnailImage, {
    foreignKey: 'imageId',
    as: 'thumbnailImages',
  });

  ProcessedImage.addScope('asServedSets', { include: [{ model: AsServedSet }] });
  ProcessedImage.addScope('asServedImages', { include: [{ model: AsServedImage, as: 'asServedImages' }] });
  ProcessedImage.addScope('asServedThumbnailImages', { include: [{ model: AsServedImage, as: 'asServedThumbnailImages' }] });
  ProcessedImage.addScope('imageMaps', { include: [{ model: ImageMap }] });
}
