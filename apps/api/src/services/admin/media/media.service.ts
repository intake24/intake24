import { randomUUID } from 'node:crypto';
import { dirname, extname, join, resolve } from 'node:path';
import filenamify from 'filenamify';
import { ensureDir, unlink } from 'fs-extra';
import sharp from 'sharp';
import { MediaConversion, MediaDisk } from '@intake24/api/config';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { CreateMediaRequest, ImageMulterFile, MediaAttributes, MediaEntry, UpdateMediaRequest } from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';
import { Media } from '@intake24/db';
import { baseObjectPath } from './store';

export type MediaStoreObject = Pick<MediaAttributes, 'id' | 'name' | 'filename' | 'mimetype' | 'size' | 'disk' | 'collection'>;
export type MediaStoreObjectUrls = MediaConversion | 'original';

type Mediable = { modelType: string; modelId: string | null } | { modelType: string; modelUuid: string | null };
type MediaModel = { id: string; modelType: string; modelId: string | null } | { id: string; modelType: string; modelUuid: string | null };

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

  const browseMedia = async (model: Mediable, query: PaginateQuery) => {
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

  const createObject = async (disk: MediaDisk, { originalname, path }: ImageMulterFile) => {
    const id = randomUUID();
    const filename = filenamify(originalname).replace(extname(originalname), '.jpg');
    const objectPath = join(dirname(path), ...baseObjectPath(id));
    await ensureDir(resolve(objectPath));

    await sharp(join(path))
      .jpeg({ mozjpeg: true })
      .resize({ width: 2048, withoutEnlargement: true })
      .toFile(resolve(objectPath, filename));
    await generateConversions(objectPath, filename);
    await Promise.all([
      mediaStore.storeObject(disk, id, objectPath),
      unlink(resolve(path)),
    ]);

    return { id, filename, disk };
  };

  const createMedia = async (model: Mediable, input: CreateMediaRequest, file: ImageMulterFile): Promise<MediaEntry> => {
    const disk = 'public';
    const { mimetype, size } = file;
    const { name, collection, global } = input;
    const { id, filename } = await createObject('public', file);

    const media = await kyselyDb.system.insertInto('media').values({
      id,
      ...(global ? { modelType: model.modelType } : model),
      disk,
      collection,
      name: name ?? filename,
      filename,
      mimetype,
      size,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returningAll().executeTakeFirstOrThrow();

    return await resolveMediaWithUrls(media);
  };

  const getMedia = async (model: MediaModel) => {
    let query = kyselyDb.system.selectFrom('media')
      .selectAll()
      .where('id', '=', model.id)
      .where('modelType', '=', model.modelType);

    query = 'modelId' in model ? query.where('modelId', '=', model.modelId) : query.where('modelUuid', '=', model.modelUuid);

    const media = await query.executeTakeFirstOrThrow(_ => new NotFoundError(`Media with ID ${model.id} not found`));

    return await resolveMediaWithUrls(media);
  };

  const updateMedia = async (model: MediaModel, input: UpdateMediaRequest): Promise<MediaEntry> => {
    let query = kyselyDb.system.updateTable('media')
      .set({
        ...(input.global ? {} : model),
        collection: input.collection,
        name: input.name,
        updatedAt: new Date(),
      })
      .where('id', '=', model.id)
      .where('modelType', '=', model.modelType);
    query = 'modelId' in model ? query.where('modelId', '=', model.modelId) : query.where('modelUuid', '=', model.modelUuid);

    const media = await query.returningAll().executeTakeFirstOrThrow();
    return await resolveMediaWithUrls(media);
  };

  const destroyMedia = async (model: MediaModel) => {
    let query = kyselyDb.system.selectFrom('media')
      .selectAll()
      .where('id', '=', model.id)
      .where('modelType', '=', model.modelType);
    query = 'modelId' in model ? query.where('modelId', '=', model.modelId) : query.where('modelUuid', '=', model.modelUuid);

    const media = await query.executeTakeFirstOrThrow(_ => new NotFoundError(`Media with ID ${model.id} not found`));

    await Promise.all([
      mediaStore.removeObject(media.disk, media.id),
      kyselyDb.system.deleteFrom('media').where('id', '=', model.id).executeTakeFirstOrThrow(),
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
