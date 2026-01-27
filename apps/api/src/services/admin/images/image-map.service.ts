import type { IoC } from '@intake24/api/ioc';
import type {
  CreateImageMapInput,
  SourceFileInput,
  UpdateImageMapInput,
} from '@intake24/common/types/http/admin';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { GuideImage, GuideImageObject, ImageMap, ImageMapObject, Op } from '@intake24/db';

function imageMapService({
  portionSizeService,
  processedImageService,
  sourceImageService,
  db,
}: Pick<IoC, 'portionSizeService' | 'processedImageService' | 'sourceImageService' | 'db'>) {
  const create = async (input: CreateImageMapInput): Promise<ImageMap> => {
    const { id, baseImage, description, label, objects, uploader } = input;

    const sourceImage = await sourceImageService.uploadSourceImage(
      { id, uploader, file: baseImage },
      'image_maps',
    );

    const processedBaseImage = await processedImageService.createImageMapBaseImage(id, sourceImage);

    return db.foods.transaction(async (transaction) => {
      const imageMap = await ImageMap.create(
        {
          id,
          description,
          label,
          baseImageId: processedBaseImage.id,
        },
        { transaction },
      );

      await ImageMapObject.bulkCreate(
        objects.map(object => ({
          ...object,
          imageMapId: imageMap.id,
        })),
        { transaction },
      );

      return imageMap;
    });
  };

  const update = async (imageMapId: string, input: UpdateImageMapInput): Promise<ImageMap> => {
    const { description, label, objects } = input;

    const imageMap = await portionSizeService.getImageMap(imageMapId);
    if (!imageMap.objects)
      throw new NotFoundError();

    const guideImages = await GuideImage.findAll({ attributes: ['id'], where: { imageMapId } });
    const guideImageIds = guideImages.map(({ id }) => id);

    await imageMap.update({ description, label });

    const objectIds = objects.map(object => object.id);
    await ImageMapObject.destroy({ where: { imageMapId, id: { [Op.notIn]: objectIds } } });

    for (const object of objects) {
      const match = imageMap.objects.find(imageMapObject => imageMapObject.id === object.id);

      if (!match) {
        await ImageMapObject.create({
          id: object.id,
          imageMapId,
          description: object.description,
          navigationIndex: object.navigationIndex,
          outlineCoordinates: object.outlineCoordinates,
          label: object.label,
        });

        if (guideImageIds.length) {
          await GuideImageObject.bulkCreate(
            guideImageIds.map(guideImageId => ({
              guideImageId,
              weight: 0,
              imageMapObjectId: object.id,
              label: object.label,
            })),
          );
        }

        continue;
      }

      await match.update({
        description: object.description,
        label: object.label,
        navigationIndex: object.navigationIndex,
        outlineCoordinates: object.outlineCoordinates,
      });
    }

    return portionSizeService.getImageMap(imageMapId);
  };

  const destroy = async (imageMapId: string): Promise<void> => {
    const imageMap = await ImageMap.findByPk(imageMapId, {
      attributes: ['id', 'baseImageId'],
      include: [{ association: 'guideImages', attributes: ['id'] }],
    });
    if (!imageMap || !imageMap.guideImages)
      throw new NotFoundError();

    if (imageMap.guideImages.length) {
      throw new ForbiddenError(
        'Image map cannot be deleted. There are guide images using this image map.',
      );
    }

    await imageMap.destroy();
    await processedImageService.destroy(imageMap.baseImageId, { includeSources: true });
  };

  const updateImage = async (
    id: string,
    baseImage: SourceFileInput,
    uploader: string,
  ): Promise<void> => {
    const sourceImage = await sourceImageService.uploadSourceImage(
      { id, uploader, file: baseImage },
      'image_maps',
    );

    const processedBaseImage = await processedImageService.createImageMapBaseImage(id, sourceImage);

    const affected = await ImageMap.update(
      {
        baseImageId: processedBaseImage.id,
      },
      { where: { id } },
    );

    if (affected[0] !== 1)
      throw new NotFoundError();
  };

  return {
    create,
    update,
    updateImage,
    destroy,
  };
}

export default imageMapService;

export type ImageMapService = ReturnType<typeof imageMapService>;
