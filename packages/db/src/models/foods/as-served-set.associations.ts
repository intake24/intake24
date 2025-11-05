import AsServedImage from './as-served-image';
import AsServedSet from './as-served-set';
import ProcessedImage from './processed-image';

export function setupAsServedSetAssociations() {
  AsServedSet.hasMany(AsServedImage, {
    foreignKey: 'asServedSetId',
    as: 'asServedImages',
  });

  AsServedSet.addScope('selectionImage', {
    include: [{ model: ProcessedImage }],
  });
  AsServedSet.addScope('asServedImages', {
    include: [{ model: AsServedImage }],
  });
}
