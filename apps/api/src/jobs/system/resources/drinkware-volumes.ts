import type { ResourceOps } from './resource';
import type { LocaleTranslation, UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function drinkwareVolumes({ kyselyDb, params: { language = ['en'] } }: ResourceOps) {
  const { total } = await kyselyDb.foods.selectFrom('drinkwareVolumeSamples').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('drinkwareVolumeSamples')
    .innerJoin('drinkwareScales', 'drinkwareScales.id', 'drinkwareVolumeSamples.drinkwareScaleId')
    .innerJoin('drinkwareSets', 'drinkwareSets.id', 'drinkwareScales.drinkwareSetId')
    .select([
      'drinkwareScales.drinkwareSetId',
      'drinkwareSets.description',
      'drinkwareScales.choiceId',
      'drinkwareVolumeSamples.fill',
      'drinkwareVolumeSamples.volume',
      'drinkwareScales.width',
      'drinkwareScales.height',
      'drinkwareScales.emptyLevel',
      'drinkwareScales.fullLevel',
      'drinkwareScales.baseImageUrl',
      'drinkwareScales.overlayImageUrl',
      'drinkwareScales.label',
    ])
    .orderBy(sql`lower(drinkware_sets.id)`)
    .orderBy('choiceId')
    .orderBy('fill')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'drinkwareSetId',
        'description',
        'choiceId',
        'fill',
        'volume',
        'width',
        'height',
        'emptyLevel',
        'fullLevel',
        'baseImageUrl',
        'overlayImageUrl',
        'label',
        ...language.map(lang => ({
          label: `label.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => row.label ? (row.label as LocaleTranslation)[lang] : undefined,
        })),
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
