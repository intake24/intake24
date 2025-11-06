import ProcessedImage from './processed-image';
import SourceImage from './source-image';
import SourceImageKeyword from './source-image-keyword';

export function setupSourceImageAssociations() {
  SourceImage.addScope('keywords', { include: [{ model: SourceImageKeyword }] });
  SourceImage.addScope('processedImages', { include: [{ model: ProcessedImage }] });
  SourceImage.hasMany(SourceImageKeyword, { foreignKey: 'sourceImageId' });
  SourceImage.hasMany(ProcessedImage, { foreignKey: 'sourceId' });
}
