import type { IoC } from '@intake24/api/ioc';
import type {
  CreateAsServedImageInput,
  CreateAsServedSetInput,
  UpdateAsServedSetInput,
} from '@intake24/common/types/http/admin';

import { NotFoundError } from '@intake24/api/http/errors';
import { AsServedImage, AsServedSet } from '@intake24/db';

function asServedService({
  portionSizeService,
  processedImageService,
  sourceImageService,
}: Pick<IoC, 'portionSizeService' | 'processedImageService' | 'sourceImageService'>) {
  const createImage = async (input: CreateAsServedImageInput): Promise<AsServedImage> => {
    const { id, label, weight } = input;

    const sourceImage = await sourceImageService.uploadSourceImage(input, 'as_served');
    const [image, thumbnailImage] = await processedImageService.createAsServedImages(id, sourceImage);

    return AsServedImage.create({
      asServedSetId: id,
      imageId: image.id,
      thumbnailImageId: thumbnailImage.id,
      label,
      weight,
    });
  };

  const destroyImage = async (asServedSetId: string, id?: string): Promise<boolean> => {
    const asServedImages = await AsServedImage.findAll({
      attributes: ['id', 'imageId', 'thumbnailImageId'],
      where: id ? { asServedSetId, id } : { asServedSetId },
    });

    for (const asServedImage of asServedImages) {
      await Promise.all([
        asServedImage.destroy(),
        processedImageService.destroy(asServedImage.imageId, { includeSources: true }),
        processedImageService.destroy(asServedImage.thumbnailImageId, { includeSources: true }),
      ]);
    }

    return !!asServedImages.length;
  };

  const createSet = async (input: CreateAsServedSetInput): Promise<AsServedSet> => {
    const { id, description, label } = input;

    const sourceImage = await sourceImageService.uploadSourceImage(input, 'as_served');
    const selectionImage = await processedImageService.createSelectionImage(id, sourceImage, 'as_served');

    return AsServedSet.create({ id, description, label, selectionImageId: selectionImage.id });
  };

  const updateSet = async (
    asServedSetId: string,
    input: UpdateAsServedSetInput,
  ): Promise<AsServedSet> => {
    const { description, label, images } = input;

    const asServedSet = await portionSizeService.getAsServedSet(asServedSetId);
    if (!asServedSet || !asServedSet.asServedImages)
      throw new NotFoundError();

    await asServedSet.update({ description, label });

    for (const image of images) {
      const match = asServedSet.asServedImages.find(item => item.id === image.id);
      if (!match)
        continue;

      await match.update({ label: image.label, weight: image.weight });
    }

    return portionSizeService.getAsServedSet(asServedSetId);
  };

  const destroySet = async (asServedSetId: string): Promise<void> => {
    const asServedSet = await AsServedSet.findByPk(asServedSetId, {
      attributes: ['id', 'selectionImageId'],
    });
    if (!asServedSet)
      throw new NotFoundError();

    await destroyImage(asServedSetId);
    await asServedSet.destroy();
    await processedImageService.destroy(asServedSet.selectionImageId, { includeSources: true });
  };

  return {
    createImage,
    destroyImage,
    createSet,
    updateSet,
    destroySet,
  };
}

export default asServedService;

export type AsServedService = ReturnType<typeof asServedService>;
