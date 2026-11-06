import type { ResourceOps } from './resource';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';

export async function nutrientTypes({ kyselyDb }: ResourceOps) {
  const { total } = await kyselyDb.foods.selectFrom('nutrientTypes').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('nutrientTypes')
    .leftJoin('nutrientUnits', 'nutrientUnits.id', 'nutrientTypes.unitId')
    .leftJoin('nutrientTypeInKcal', 'nutrientTypeInKcal.nutrientTypeId', 'nutrientTypes.id')
    .select([
      'nutrientTypes.id',
      'nutrientTypes.description',
      'nutrientTypes.unitId',
      'nutrientUnits.description as unitDescription',
      'nutrientUnits.symbol as unitSymbol',
      'nutrientTypeInKcal.kcalPerUnit',
    ])
    .orderBy('id')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'description',
        'unitId',
        'unitDescription',
        'unitSymbol',
        'kcalPerUnit',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
