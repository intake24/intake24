import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function drinkwareSets({ config, kyselyDb }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('drinkwareSets').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('drinkwareSets')
    .innerJoin('imageMaps', 'imageMaps.id', 'drinkwareSets.imageMapId')
    .leftJoin('processedImages as baseImage', 'baseImage.id', 'imageMaps.baseImageId')
    .select([
      'drinkwareSets.id',
      'drinkwareSets.description',
      'drinkwareSets.imageMapId',
      'imageMaps.description as imageMapDescription',
      'baseImage.path as baseImagePath',
      'baseImage.purpose as baseImagePurpose',
    ])
    .orderBy(sql`lower(drinkware_sets.id)`)
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
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
