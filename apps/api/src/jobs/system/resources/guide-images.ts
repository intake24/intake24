import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function guideImages({ config, kyselyDb }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('guideImages').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('guideImages')
    .innerJoin('imageMaps', 'imageMaps.id', 'guideImages.imageMapId')
    .leftJoin('processedImages as baseImage', 'baseImage.id', 'imageMaps.baseImageId')
    .leftJoin('processedImages as selectionImage', 'selectionImage.id', 'guideImages.selectionImageId')
    .select([
      'guideImages.id',
      'guideImages.description',
      'guideImages.imageMapId',
      'imageMaps.description as imageMapDescription',
      'baseImage.path as baseImagePath',
      'baseImage.purpose as baseImagePurpose',
      'selectionImage.path as selectionImagePath',
      'selectionImage.purpose as selectionImagePurpose',
    ])
    .orderBy(sql`lower(guide_images.id)`)
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'description',
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
