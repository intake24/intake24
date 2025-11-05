import AsServedImage from './as-served-image';
import AsServedSet from './as-served-set';
import ProcessedImage from './processed-image';

export function setupAsServedImageAssociations() {
  AsServedImage.belongsTo(AsServedSet, {
    foreignKey: 'asServedSetId',
    as: 'asServedSet',
  });

  AsServedImage.addScope('asServedSet', {
    include: [{ model: AsServedSet }],
  });
  AsServedImage.addScope('image', {
    include: [{ model: ProcessedImage, as: 'image' }],
  });
  AsServedImage.addScope('thumbnailImage', {
    include: [{ model: ProcessedImage, as: 'thumbnailImage' }],
  });
};
