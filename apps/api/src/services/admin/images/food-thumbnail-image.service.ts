import type { IoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import type { FoodHeader } from '@intake24/common/types/http';
import type { SourceFileInput } from '@intake24/common/types/http/admin';
import { FoodThumbnailImage } from '@intake24/db';

function foodThumbnailImageService({
  processedImageService,
  sourceImageService,
  kyselyDb,
  imagesBaseUrl,
}: Pick<IoC, 'processedImageService' | 'sourceImageService' | 'kyselyDb' | 'imagesBaseUrl'>) {
  const createImage = async (uploaderId: string, foodId: string, sourceImageInput: SourceFileInput): Promise<FoodThumbnailImage> => {
    const sourceImage = await sourceImageService.uploadSourceImage({ file: sourceImageInput, uploader: uploaderId, id: foodId }, 'food_thumbnail');
    const thumbnailImage = await processedImageService.createFoodThumbnailImage(foodId, sourceImage);

    // This feature is wonky...
    // According to https://sequelize.org/docs/v6/other-topics/upgrade created is always null in Postgres
    // conflictFields only works in Postgres
    // Type checker expects conflictFields to be camel case but it's not converted to snake case in the actual query
    const [instance, _] = await FoodThumbnailImage.upsert({
      foodId,
      imageId: thumbnailImage.id,
    }, { conflictFields: ['food_id' as any] });

    return instance;
  };

  const resolveImages = async (foodId: string[]): Promise<Dictionary<string>> => {
    if (!foodId.length)
      return {};

    const rows = await kyselyDb.foods
      .selectFrom('foodThumbnailImages')
      .innerJoin('processedImages', 'foodThumbnailImages.imageId', 'processedImages.id')
      .select(['foodThumbnailImages.foodId', 'processedImages.path'])
      .where('foodThumbnailImages.foodId', 'in', foodId)
      .execute();

    return Object.fromEntries(rows.map(row => [row.foodId, row.path]));
  };

  const appendThumbnailUrls = async (foodHeaders: FoodHeader[]) => {
    const imagePaths = await resolveImages(foodHeaders.map(header => header.id));

    function getUrl(foodCode: string): string | undefined {
      const path = imagePaths[foodCode];
      if (path === undefined)
        return undefined;
      return `${imagesBaseUrl}/${path}`;
    }

    return foodHeaders.map(header => ({ ...header, thumbnailImageUrl: getUrl(header.code) }));
  };

  return {
    createImage,
    resolveImages,
    appendThumbnailUrls,
  };
}

export default foodThumbnailImageService;

export type FoodThumbnailImageService = ReturnType<typeof foodThumbnailImageService>;
