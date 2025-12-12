import type { ResourceOps } from './resource';
import { Readable } from 'node:stream';
import { Transform } from '@json2csv/node';
import { sql } from 'kysely';
import type { LocaleTranslation, UnwrapAII } from '@intake24/common/types';

export async function imageMapObjects({ config, kyselyDb, params: { language = ['en'] } }: ResourceOps) {
  const getImageUrl = (url?: string | null) => url ? `${config.app.urls.images}/${url}` : null;

  const { total } = await kyselyDb.foods.selectFrom('imageMapObjects').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.foods
    .selectFrom('imageMapObjects')
    .innerJoin('imageMaps', 'imageMaps.id', 'imageMapObjects.imageMapId')
    .leftJoin('processedImages as baseImage', 'baseImage.id', 'imageMaps.baseImageId')
    .select([
      'imageMapObjects.id',
      'imageMapObjects.description',
      'imageMapObjects.label',
      'imageMapObjects.navigationIndex',
      'imageMapObjects.imageMapId as imageMapId',
      'imageMaps.description as imageMapDescription',
      'baseImage.path as baseImagePath',
      'baseImage.purpose as baseImagePurpose',
    ])
    .orderBy(sql`lower(image_maps.id)`)
    .orderBy('id')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'description',
        ...language.map(lang => ({
          label: `label.${lang}`,
          value: (row: UnwrapAII<typeof cursor>) => row.label ? (row.label as LocaleTranslation)[lang] : undefined,
        })),
        'navigationIndex',
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
