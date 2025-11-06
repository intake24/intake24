import GuideImage from './guide-image';
import GuideImageObject from './guide-image-object';
import ImageMap from './image-map';
import ProcessedImage from './processed-image';

export function setupGuideImageAssociations() {
  GuideImage.belongsTo(ImageMap, {
    foreignKey: 'imageMapId',
    as: 'imageMap',
  });

  GuideImage.belongsTo(ProcessedImage, {
    foreignKey: 'selectionImageId',
    as: 'selectionImage',
  });

  GuideImage.hasMany(GuideImageObject, {
    foreignKey: 'guideImageId',
    as: 'objects',
  });

  GuideImage.addScope('imageMap', { include: [{ model: ImageMap }] });
  GuideImage.addScope('selectionImage', { include: [{ model: ProcessedImage }] });
  GuideImage.addScope('objects', { include: [{ model: GuideImageObject }] });
}
