import type { IoC } from '@intake24/api/ioc';
import type {
  CreateGuideImageInput,
  UpdateGuideImageInput,
} from '@intake24/common/types/http/admin';

import { NotFoundError } from '@intake24/api/http/errors';
import { GuideImage, GuideImageObject, ImageMap, ImageMapObject } from '@intake24/db';

function guideImageService({
  portionSizeService,
  processedImageService,
}: Pick<IoC, 'portionSizeService' | 'processedImageService'>) {
  const create = async (input: CreateGuideImageInput): Promise<GuideImage> => {
    const { id, description, label, imageMapId } = input;

    const imageMap = await ImageMap.findByPk(imageMapId, { include: ['baseImage'] });
    if (!imageMap || !imageMap.baseImage)
      throw new NotFoundError();

    const selectionImage = await processedImageService.createSelectionImage(
      id,
      imageMap.baseImage.sourceId,
      'guide',
    );

    const guideImage = await GuideImage.create({
      id,
      description,
      label,
      imageMapId,
      selectionImageId: selectionImage.id,
    });

    const imageMapObjects = await ImageMapObject.findAll({
      where: { imageMapId },
      order: [['id', 'ASC']],
    });

    const guideImageObjects = imageMapObjects.map(object => ({
      guideImageId: guideImage.id,
      imageMapObjectId: object.id,
      weight: 0,
      label: object.label,
    }));

    await GuideImageObject.bulkCreate(guideImageObjects);

    return guideImage;
  };

  const update = async (
    guideImageId: string,
    input: UpdateGuideImageInput,
  ): Promise<GuideImage> => {
    const { description, label, objects } = input;

    const guideImage = await portionSizeService.getGuideImage(guideImageId);
    if (!guideImage.objects)
      throw new NotFoundError();

    await guideImage.update({ description, label });

    for (const object of objects) {
      const { id, label, weight } = object;
      const match = guideImage.objects.find(guideObject => guideObject.imageMapObjectId === id);

      if (!match) {
        await GuideImageObject.create({ guideImageId, imageMapObjectId: id, label, weight });
        continue;
      }

      await match.update({ label, weight });
    }

    return portionSizeService.getGuideImage(guideImageId);
  };

  const destroy = async (guideImageId: string): Promise<void> => {
    const guideImage = await GuideImage.findByPk(guideImageId, {
      attributes: ['id', 'selectionImageId'],
    });
    if (!guideImage)
      throw new NotFoundError();

    await guideImage.destroy();
    await processedImageService.destroy(guideImage.selectionImageId);
  };

  return {
    create,
    update,
    destroy,
  };
}

export default guideImageService;

export type GuideImageService = ReturnType<typeof guideImageService>;
