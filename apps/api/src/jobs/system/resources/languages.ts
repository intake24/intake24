import type { ResourceOps } from './resource';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';

export async function languages({ kyselyDb }: ResourceOps) {
  const { total } = await kyselyDb.system.selectFrom('languages').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.system.selectFrom('languages').selectAll().orderBy('id').stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'code',
        'englishName',
        'localName',
        'countryFlagCode',
        'textDirection',
        'ownerId',
        'visibility',
        'createdAt',
        'updatedAt',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
