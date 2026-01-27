import type { ResourceOps } from './resource';
import type { LocaleTranslation, UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function guideImageObjects({ config, kyselyDb, params: { language = ['en'] } }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('guideImageObjects').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('guideImageObjects')
    .innerJoin('guideImages', 'guideImages.id', 'guideImageObjects.guideImageId')
    .innerJoin('imageMaps', 'imageMaps.id', 'guideImages.imageMapId')
    .innerJoin(
      'imageMapObjects',
      join => join
        .onRef('imageMapObjects.id', '=', 'guideImageObjects.imageMapObjectId')
        .onRef('imageMapObjects.imageMapId', '=', 'guideImages.imageMapId'),
    )
    .leftJoin('processedImages as baseImage', 'baseImage.id', 'imageMaps.baseImageId')
    .leftJoin('processedImages as selectionImage', 'selectionImage.id', 'guideImages.selectionImageId')
    .select([
      'guideImageObjects.id',
      'guideImageObjects.weight',
      'guideImageObjects.label',
      'guideImageObjects.guideImageId',
      'guideImages.description as guideImageDescription',
      'imageMapObjects.id as imageMapObjectId',
      'imageMapObjects.description as imageMapObjectDescription',
      'imageMapObjects.label as imageMapObjectLabel',
      'imageMapObjects.navigationIndex as imageMapObjectNavigationIndex',
      'guideImages.imageMapId as imageMapId',
      'imageMaps.description as imageMapDescription',
      'baseImage.path as baseImagePath',
      'baseImage.purpose as baseImagePurpose',
      'selectionImage.path as selectionImagePath',
      'selectionImage.purpose as selectionImagePurpose',
    ])
    .orderBy(sql`lower(guide_images.id)`)
    .orderBy('imageMapObjectId')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'weight',
        ...language.map(lang => ({
          label: `label.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => row.label ? (row.label as LocaleTranslation)[lang] : undefined,
        })),
        'guideImageId',
        'guideImageDescription',
        'imageMapObjectId',
        'imageMapObjectDescription',
        ...language.map(lang => ({
          label: `imageMapObjectLabel.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => row.imageMapObjectLabel ? (row.imageMapObjectLabel as LocaleTranslation)[lang] : undefined,
        })),
        'imageMapObjectNavigationIndex',
        'imageMapId',
        'imageMapDescription',
        { label: 'baseImagePath', value: (row: UnwrapAII<typeof cursor>) => getImageUrl(row.baseImagePath) },
        'baseImagePurpose',
        { label: 'selectionImagePath', value: (row: UnwrapAII<typeof cursor>) => getImageUrl(row.selectionImagePath) },
        'selectionImagePurpose',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
