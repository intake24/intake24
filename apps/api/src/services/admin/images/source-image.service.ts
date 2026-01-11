import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import fs from 'fs-extra';
import sharp from 'sharp';

import type { IoC } from '@intake24/api/ioc';
import type { SourceImageType, UploadSourceImageInput } from '@intake24/common/types/http/admin';
import { SourceImage } from '@intake24/db';

function sourceImageService({
  fsConfig,
  imageProcessorConfig,
  logger: globalLogger,
}: Pick<IoC, 'fsConfig' | 'logger' | 'imageProcessorConfig'>) {
  const { images: imagesPath } = fsConfig.local;
  const logger = globalLogger.child({ service: 'SourceImageService' });

  const uploadSourceImage = async (
    input: UploadSourceImageInput,
    type: SourceImageType,
  ): Promise<SourceImage> => {
    const { id, file, uploader } = input;

    const filename = `${randomUUID()}${path.extname(file.originalname)}`;

    const sourceDir = path.posix.join('source', type, id);
    const sourceThumbDir = path.posix.join('source', 'thumbnails', type, id);

    const sourcePath = path.posix.join(sourceDir, filename);
    const sourceThumbPath = path.posix.join(sourceThumbDir, filename);

    for (const dir of [sourceDir, sourceThumbDir])
      await fs.ensureDir(path.join(imagesPath, dir));

    await fs.copy(file.path, path.join(imagesPath, sourcePath));

    await sharp(path.join(imagesPath, sourcePath))
      .resize(
        imageProcessorConfig.source.thumbnailWidth,
        imageProcessorConfig.source.thumbnailHeight,
      )
      .jpeg({ mozjpeg: true })
      .toFile(path.join(imagesPath, sourceThumbPath));

    return SourceImage.create({
      path: sourcePath,
      uploader: uploader.toString(),
      uploadedAt: new Date(),
      thumbnailPath: sourceThumbPath,
    });
  };

  const destroy = async (sourceImageId: string | string[]): Promise<void> => {
    const sourceImages = await SourceImage.findAll({
      attributes: ['id', 'path', 'thumbnailPath'],
      where: { id: sourceImageId },
    });

    for (const sourceImage of sourceImages) {
      await sourceImage.destroy();

      try {
        await unlink(path.join(imagesPath, sourceImage.path));
        await unlink(path.join(imagesPath, sourceImage.thumbnailPath));
      }
      catch (err) {
        if (err instanceof Error) {
          const { message, name, stack } = err;
          logger.error(`${name}: ${message}`, { stack });
          return;
        }

        logger.error(err);
      }
    }
  };

  return {
    uploadSourceImage,
    destroy,
  };
}

export default sourceImageService;

export type SourceImageService = ReturnType<typeof sourceImageService>;
