import type { MediaConversion, MediaDisk } from '@intake24/api/config';
import type { IoC } from '@intake24/api/ioc';
import type { CreateMediaWithModelRequest, ImageMulterFile, MediaAttributes, MediaEntry, UpdateMediaWithModelRequest } from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';

import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

import filenamify from 'filenamify';
import { ensureDir } from 'fs-extra';
import sharp from 'sharp';

import { NotFoundError } from '@intake24/api/http/errors';
import { Media } from '@intake24/db';

import { baseObjectPath } from './store';

export type MediaStoreObject = Pick<MediaAttributes, 'id' | 'name' | 'filename' | 'mimetype' | 'size' | 'disk' | 'collection'>;
export type MediaStoreObjectUrls = MediaConversion | 'original';

type Mediable = { modelType: string; modelId: string | null };
type MediaId = string | { id: string } & Mediable;

/* const optiConfig = {
  avif: { quality: 50 },
  jpeg: { quality: 80 },
  png: { compressionLevel: 8 },
  webp: { quality: 80 },
}; */

function assertFormat(format: any): format is 'avif' | 'jpeg' | 'png' | 'webp' {
  return ['avif', 'jpeg', 'png', 'webp'].includes(format);
}

function mediaService({ mediaStore, appConfig, kyselyDb, mediaConfig }: Pick<IoC, 'mediaStore' | 'appConfig' | 'kyselyDb' | 'mediaConfig'>) {
  const getUrl = ({ id, filename }: MediaStoreObject, conversion?: MediaConversion) => {
    const ext = extname(filename);

    const segments = [appConfig.urls.media, ...baseObjectPath(id)];
    segments.push(...(conversion ? ['conversions', filename.replace(ext, `-${conversion}${ext}`)] : [filename]));

    return segments.join('/');
  };

  const getUrls = (object: MediaStoreObject): { url: string; sizes: Record<MediaStoreObjectUrls, string> } => {
    const sizes = (Object.keys(mediaConfig.conversions) as MediaConversion[]).reduce((acc, conversion) => {
      acc[conversion] = getUrl(object, conversion);
      return acc;
    }, {} as Record<MediaStoreObjectUrls, string>);

    return { sizes, url: getUrl(object) };
  };

  const browseMedia = async (query: PaginateQuery, model?: Mediable) => {
    const media = await Media.paginate({
      query,
      columns: ['name', 'filename'],
      where: model,
      order: [['createdAt', 'ASC']],
      transform: media => ({ ...media.get(), ...getUrls(media) }),
    });

    return media;
  };

  const getMediaById = async (mediaId: string) => {
    const media = await kyselyDb.system.selectFrom('media')
      .selectAll()
      .where('id', '=', mediaId)
      .executeTakeFirstOrThrow(_ => new NotFoundError(`Media with ID ${mediaId} not found`));

    return media;
  };

  const resolveMediaWithUrls = async (media: string | MediaAttributes): Promise<MediaEntry> => {
    const mediaEntry = typeof media === 'string' ? await getMediaById(media) : media;
    return { ...mediaEntry, ...getUrls(mediaEntry) };
  };

  const generateConversions = async (objectPath: string, filename: string) => {
    const { format } = await sharp(join(objectPath, filename)).metadata();
    if (!assertFormat(format))
      throw new Error(`Unsupported image format: ${format}`);

    const conversionsPath = join(objectPath, 'conversions');
    await ensureDir(resolve(conversionsPath));

    const ext = extname(filename);

    await Promise.all(Object.entries(mediaConfig.conversions)
      .map(([conversion, options]) =>
        sharp(join(objectPath, filename))
          .resize({ ...options, withoutEnlargement: true })
          .toFile(join(conversionsPath, `${filename.replace(ext, `-${conversion}${ext}`)}`)),
      ));
  };

  const createObject = async (input: { id?: string; disk: MediaDisk }, { originalname, path }: ImageMulterFile) => {
    const {
      id = randomUUID(),
      disk,
    } = input;

    const filename = filenamify(originalname, { maxLength: 128 }).replace(extname(originalname), '.jpg');
    const objectPath = join(dirname(path), ...baseObjectPath(id));
    await ensureDir(resolve(objectPath));

    const { size } = await sharp(join(path))
      .jpeg({ mozjpeg: true })
      .resize({ width: 2048, withoutEnlargement: true })
      .toFile(resolve(objectPath, filename));

    await generateConversions(objectPath, filename);
    await Promise.all([
      mediaStore.storeObject(disk, id, objectPath),
      unlink(resolve(path)),
    ]);

    return {
      id,
      filename,
      disk,
      mimetype: 'image/jpeg',
      size,
    };
  };

  const createMedia = async (input: CreateMediaWithModelRequest, file: ImageMulterFile): Promise<MediaEntry> => {
    const { name, ...rest } = input;
    const { id, filename, mimetype, size } = await createObject(input, file);

    const media = await kyselyDb.system.insertInto('media').values({
      ...rest,
      id,
      name: name ?? filename,
      filename,
      mimetype,
      size,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returningAll().executeTakeFirstOrThrow();

    return await resolveMediaWithUrls(media);
  };

  const getMedia = async (id: MediaId) => {
    let query = kyselyDb.system.selectFrom('media').selectAll();

    if (typeof id === 'string') {
      query = query.where('id', '=', id);
    }
    else {
      query = query.where('id', '=', id.id)
        .where('modelType', '=', id.modelType)
        .where('modelId', '=', id.modelId);
    }

    const media = await query.executeTakeFirstOrThrow(_ => new NotFoundError(`Media with ID ${id} not found`));

    return await resolveMediaWithUrls(media);
  };

  const updateMedia = async (id: MediaId, input: UpdateMediaWithModelRequest): Promise<MediaEntry> => {
    let query = kyselyDb.system.updateTable('media').set({ ...input, updatedAt: new Date() });

    if (typeof id === 'string') {
      query = query.where('id', '=', id);
    }
    else {
      query = query.where('id', '=', id.id)
        .where('modelType', '=', id.modelType)
        .where('modelId', '=', id.modelId);
    }

    const media = await query.returningAll().executeTakeFirstOrThrow();

    return await resolveMediaWithUrls(media);
  };

  const destroyMedia = async (id: MediaId) => {
    let query = kyselyDb.system.selectFrom('media').selectAll();

    if (typeof id === 'string') {
      query = query.where('id', '=', id);
    }
    else {
      query = query.where('id', '=', id.id)
        .where('modelType', '=', id.modelType)
        .where('modelId', '=', id.modelId);
    }

    const media = await query.executeTakeFirstOrThrow(_ => new NotFoundError(`Media with ID ${id} not found`));

    await Promise.all([
      mediaStore.removeObject(media.disk, media.id),
      kyselyDb.system.deleteFrom('media').where('id', '=', media.id).executeTakeFirstOrThrow(),
    ]);
  };

  return {
    browseMedia,
    createMedia,
    getMedia,
    updateMedia,
    destroyMedia,
  };
}

export default mediaService;

export type MediaService = ReturnType<typeof mediaService>;
