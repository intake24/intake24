import SourceImage from './source-image';
import SourceImageKeyword from './source-image-keyword';

export function setupSourceImageKeywordAssociations() {
  SourceImageKeyword.addScope('sourceImage', { include: [{ model: SourceImage }] });
  SourceImageKeyword.belongsTo(SourceImage, { foreignKey: 'sourceImageId' });
}
