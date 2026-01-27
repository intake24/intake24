import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function imageMaps({ config, kyselyDb }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('imageMaps').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('imageMaps')
    .leftJoin('processedImages', 'processedImages.id', 'imageMaps.baseImageId')
    .select([
      'imageMaps.id',
      'imageMaps.description',
      'processedImages.path as baseImagePath',
      'processedImages.purpose as baseImagePurpose',
    ])
    .orderBy(sql`lower(image_maps.id)`)
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'description',
        { label: 'baseImagePath', value: (row: UnwrapAII<typeof cursor>) => getImageUrl(row.baseImagePath) },
        'baseImagePurpose',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
