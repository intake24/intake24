import type { ResourceOps } from './resource';
import { Readable } from 'node:stream';
import { Transform } from '@json2csv/node';
import { sql } from 'kysely';
import type { RequiredLocaleTranslation, UnwrapAII } from '@intake24/common/types';

export async function standardUnits({ kyselyDb, params: { language = ['en'] } }: ResourceOps) {
  const { total } = await kyselyDb.foods.selectFrom('standardUnits').select(({ fn }) => [fn.count<number>('id').as('total')]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods.selectFrom('standardUnits').selectAll().orderBy(sql`lower(id) asc`).stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'name',
        ...language.map(lang => ({
          label: `estimateIn.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => (row.estimateIn as RequiredLocaleTranslation)[lang],
        })),
        ...language.map(lang => ({
          label: `howMany.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => (row.howMany as RequiredLocaleTranslation)[lang],
        })),
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
