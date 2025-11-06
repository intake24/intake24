import Food from './food';
import FoodThumbnailImage from './food-thumbnail-image';
import ProcessedImage from './processed-image';

export function setupFoodThumbnailImageAssociations() {
  FoodThumbnailImage.belongsTo(Food, {
    foreignKey: 'foodId',
    as: 'food',
  });

  FoodThumbnailImage.belongsTo(ProcessedImage, {
    foreignKey: 'imageId',
    as: 'image',
  });

  FoodThumbnailImage.addScope('image', { include: [{ model: ProcessedImage, as: 'image' }] });
}
