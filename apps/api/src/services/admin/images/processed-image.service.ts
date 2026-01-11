import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import fs from 'fs-extra';
import sharp from 'sharp';

import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { ProcessedImage, ProcessedImagePurposes, SourceImage } from '@intake24/db';

export type SelectionImageType = 'guide' | 'as_served';

export type DestroyOptions = { includeSources?: boolean };

function processedImageService({
  fsConfig,
  logger: globalLogger,
  sourceImageService,
  imageProcessorConfig,
}: Pick<IoC, 'fsConfig' | 'logger' | 'sourceImageService' | 'imageProcessorConfig'>) {
  const { images: imagesPath } = fsConfig.local;
  const logger = globalLogger.child({ service: 'ProcessedImageService' });

  const resolveSourceImage = async (sourceImageId: string): Promise<SourceImage> => {
    const sourceImage = await SourceImage.findByPk(sourceImageId, { attributes: ['id', 'path'] });
    if (!sourceImage) {
      logger.warn(
        `resolveSourceImage: Source image (${sourceImageId}) for selection image not found.`,
      );
      throw new NotFoundError();
    }

    try {
      await fs.access(path.join(imagesPath, sourceImage.path), fs.constants.F_OK);
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.error(`${name}: ${message}`, { stack });
      }
      else {
        logger.error(err);
      }

      throw new NotFoundError();
    }

    return sourceImage;
  };

  const createAsServedImages = async (
    id: string,
    sourceImage: SourceImage | string,
  ): Promise<[ProcessedImage, ProcessedImage]> => {
    const image
      = typeof sourceImage === 'string' ? await resolveSourceImage(sourceImage) : sourceImage;

    const fileName = `${randomUUID()}${path.extname(image.path)}`;
    const fileDir = path.posix.join('as_served', id);
    const fullPath = path.posix.join(fileDir, fileName);

    const thumbFileName = `${randomUUID()}${path.extname(image.path)}`;
    const thumbFileDir = path.posix.join('as_served', id, 'thumbnails');
    const thumbFullPath = path.posix.join(fileDir, thumbFileName);

    await Promise.all([
      fs.ensureDir(path.join(imagesPath, fileDir)),
      fs.ensureDir(path.join(imagesPath, thumbFileDir)),
    ]);

    await Promise.all([
      sharp(path.join(imagesPath, image.path))
        .resize(imageProcessorConfig.asServed.width)
        .jpeg({ mozjpeg: true })
        .toFile(path.join(imagesPath, fullPath)),
      sharp(path.join(imagesPath, image.path))
        .resize(imageProcessorConfig.asServed.thumbnailWidth)
        .jpeg({ mozjpeg: true })
        .toFile(path.join(imagesPath, thumbFullPath)),
    ]);

    return Promise.all([
      ProcessedImage.create({
        path: fullPath,
        sourceId: image.id,
        purpose: ProcessedImagePurposes.AsServedMainImage,
      }),
      ProcessedImage.create({
        path: thumbFullPath,
        sourceId: image.id,
        purpose: ProcessedImagePurposes.AsServedThumbnail,
      }),
    ]);
  };

  const createImageMapBaseImage = async (
    id: string,
    sourceImage: SourceImage | string,
  ): Promise<ProcessedImage> => {
    const image
      = typeof sourceImage === 'string' ? await resolveSourceImage(sourceImage) : sourceImage;

    const fileName = `${randomUUID()}${path.extname(image.path)}`;
    const fileDir = path.posix.join('image_maps', id);
    const fullPath = path.posix.join(fileDir, fileName);

    await fs.ensureDir(path.join(imagesPath, fileDir));

    await sharp(path.join(imagesPath, image.path))
      .resize(imageProcessorConfig.imageMaps.width)
      .jpeg({ mozjpeg: true })
      .toFile(path.join(imagesPath, fullPath));

    return ProcessedImage.create({
      path: fullPath,
      sourceId: image.id,
      purpose: ProcessedImagePurposes.ImageMapBaseImage,
    });
  };

  const createSelectionImage = async (
    id: string,
    sourceImage: SourceImage | string,
    type: SelectionImageType,
  ): Promise<ProcessedImage> => {
    const image
      = typeof sourceImage === 'string' ? await resolveSourceImage(sourceImage) : sourceImage;

    const fileName = `${randomUUID()}${path.extname(image.path)}`;
    const fileDir = path.posix.join(type, id, 'selection');
    const filePath = path.posix.join(fileDir, fileName);

    await fs.ensureDir(path.join(imagesPath, fileDir));

    await sharp(path.join(imagesPath, image.path))
      .resize(
        imageProcessorConfig.optionSelection.width,
        imageProcessorConfig.optionSelection.height,
      )
      .jpeg({ mozjpeg: true })
      .toFile(path.join(imagesPath, filePath));

    return ProcessedImage.create({
      path: filePath,
      sourceId: image.id,
      purpose: ProcessedImagePurposes.SelectionImage,
    });
  };

  const createDrinkScaleBaseImage = async (
    drinkwareSetId: string,
    sourceImage: SourceImage | string,
  ): Promise<ProcessedImage> => {
    const image
      = typeof sourceImage === 'string' ? await resolveSourceImage(sourceImage) : sourceImage;

    const fileName = `${randomUUID()}${path.extname(image.path)}`;
    const fileDir = path.posix.join('drinkware', drinkwareSetId);
    const fullPath = path.posix.join(fileDir, fileName);

    await fs.ensureDir(path.join(imagesPath, fileDir));

    await sharp(path.join(imagesPath, image.path))
      .resize(imageProcessorConfig.drinkScale.width)
      .jpeg({ mozjpeg: true })
      .toFile(path.join(imagesPath, fullPath));

    return ProcessedImage.create({
      path: fullPath,
      sourceId: image.id,
      purpose: ProcessedImagePurposes.DrinkScaleBaseImage,
    });
  };

  const createFoodThumbnailImage = async (
    foodId: string,
    sourceImage: SourceImage | string,
  ): Promise<ProcessedImage> => {
    const image
      = typeof sourceImage === 'string' ? await resolveSourceImage(sourceImage) : sourceImage;

    const fileName = `${randomUUID()}${path.extname(image.path)}`;
    const fileDir = path.posix.join('food_thumbnails', foodId);
    const fullPath = path.posix.join(fileDir, fileName);

    await fs.ensureDir(path.join(imagesPath, fileDir));

    await sharp(path.join(imagesPath, image.path))
      .resize(imageProcessorConfig.foodThumbnailImage.width)
      .jpeg({ mozjpeg: true })
      .toFile(path.join(imagesPath, fullPath));

    return ProcessedImage.create({
      path: fullPath,
      sourceId: image.id,
      purpose: ProcessedImagePurposes.FoodThumbnailImage,
    });
  };

  const destroy = async (imageId: string, options: DestroyOptions = {}): Promise<void> => {
    const processedImage = await ProcessedImage.findByPk(imageId, {
      attributes: ['id', 'path', 'sourceId'],
    });
    if (!processedImage) {
      logger.warn(`destroy: processed image not found. (ID: ${imageId})`);
      return;
    }

    await processedImage.destroy();

    try {
      await unlink(path.join(imagesPath, processedImage.path));
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.error(`${name}: ${message}`, { stack });
        return;
      }

      logger.error(err);
    }

    const { includeSources } = options;
    if (includeSources)
      await sourceImageService.destroy(processedImage.sourceId);
  };

  return {
    createAsServedImages,
    createImageMapBaseImage,
    createSelectionImage,
    createDrinkScaleBaseImage,
    createFoodThumbnailImage,
    destroy,
  };
}

export default processedImageService;

export type ProcessedImageService = ReturnType<typeof processedImageService>;
