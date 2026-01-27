import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function asServedSets({ config, kyselyDb }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('asServedSets').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('asServedSets')
    .leftJoin('processedImages', 'processedImages.id', 'asServedSets.selectionImageId')
    .select([
      'asServedSets.id',
      'asServedSets.description',
      'processedImages.path as selectionImagePath',
      'processedImages.purpose as selectionImagePurpose',
    ])
    .orderBy(sql`lower(as_served_sets.id)`)
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'description',
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
