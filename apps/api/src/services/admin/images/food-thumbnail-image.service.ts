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
  const createImage = async (uploaderId: string, foodLocalId: string, sourceImageInput: SourceFileInput): Promise<FoodThumbnailImage> => {
    const sourceImage = await sourceImageService.uploadSourceImage({ file: sourceImageInput, uploader: uploaderId, id: foodLocalId }, 'food_thumbnail');
    const thumbnailImage = await processedImageService.createFoodThumbnailImage(foodLocalId, sourceImage);

    // This feature is wonky...
    // According to https://sequelize.org/docs/v6/other-topics/upgrade created is always null in Postgres
    // conflictFields only works in Postgres
    // Type checker expects conflictFields to be camel case but it's not converted to snake case in the actual query
    const [instance, _] = await FoodThumbnailImage.upsert({
      foodLocalId,
      imageId: thumbnailImage.id,
    }, { conflictFields: ['food_local_id' as any] });

    return instance;
  };

  const resolveImages = async (localeId: string, foodCodes: string[]): Promise<Dictionary<string>> => {
    if (foodCodes.length === 0)
      return {};

    const rows = await kyselyDb.foods
      .selectFrom('foodLocals')
      .innerJoin('foodThumbnailImages', 'foodLocals.id', 'foodThumbnailImages.foodLocalId')
      .innerJoin('processedImages', 'foodThumbnailImages.imageId', 'processedImages.id')
      .select(['foodLocals.foodCode as foodCode', 'processedImages.path as path'])
      .where('foodLocals.localeId', '=', localeId)
      .where('foodLocals.foodCode', 'in', foodCodes)
      .execute();

    return Object.fromEntries(rows.map(row => [row.foodCode, row.path]));
  };

  const appendThumbnailUrls = async (localeId: string, foodHeaders: FoodHeader[]) => {
    const imagePaths = await resolveImages(localeId, foodHeaders.map(header => header.code));

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
