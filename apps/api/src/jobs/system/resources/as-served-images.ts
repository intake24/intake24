import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function asServedImages({ config, kyselyDb }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('asServedImages').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('asServedImages')
    .innerJoin('asServedSets', 'asServedSets.id', 'asServedImages.asServedSetId')
    .leftJoin('processedImages as image', 'image.id', 'asServedImages.imageId')
    .leftJoin('processedImages as thumbnailImage', 'thumbnailImage.id', 'asServedImages.thumbnailImageId')
    .select([
      'asServedImages.id',
      'asServedImages.weight',
      'asServedImages.asServedSetId',
      'asServedSets.description as asServedSetDescription',
      'image.path as imagePath',
      'image.purpose as imagePurpose',
      'thumbnailImage.path as thumbnailImagePath',
      'thumbnailImage.purpose as thumbnailImagePurpose',
    ])
    .orderBy(sql`lower(as_served_sets.id)`)
    .orderBy('weight')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'weight',
        'asServedSetId',
        'asServedSetDescription',
        { label: 'imagePath', value: (row: UnwrapAII<typeof cursor>) => getImageUrl(row.imagePath) },
        'imagePurpose',
        { label: 'thumbnailImagePath', value: (row: UnwrapAII<typeof cursor>) => getImageUrl(row.thumbnailImagePath) },
        'thumbnailImagePurpose',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
