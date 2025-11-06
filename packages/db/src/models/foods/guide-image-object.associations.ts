import GuideImage from './guide-image';
import GuideImageObject from './guide-image-object';

export function setupGuideImageObjectAssociations() {
  GuideImageObject.belongsTo(GuideImage, {
    foreignKey: 'guideImageId',
    as: 'guideImage',
  });
}
