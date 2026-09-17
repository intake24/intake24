import type { ResourceOps } from './resource';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { sql } from 'kysely';

export async function surveys({ kyselyDb }: ResourceOps) {
  const { total } = await kyselyDb.system.selectFrom('surveys').select(({ fn }) => [fn.count<number>('id').as('total')]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.system
    .selectFrom('surveys')
    .innerJoin('locales', 'locales.id', 'surveys.localeId')
    .innerJoin('surveySchemes', 'surveySchemes.id', 'surveys.surveySchemeId')
    .leftJoin('userSurveyAliases', 'userSurveyAliases.surveyId', 'surveys.id')
    .leftJoin(
      eb => eb
        .selectFrom('surveySubmissions')
        .select(({ fn }) => ['surveyId', fn.count<number>('id').as('submissions')])
        .groupBy('surveySubmissions.surveyId')
        .as('ssb'),
      join => join
        .onRef('ssb.surveyId', '=', 'surveys.id'),
    )
    .select(({ fn }) => [
      'surveys.id',
      'surveys.startDate',
      'surveys.endDate',
      'locales.code as localeCode',
      'locales.localName as localeName',
      'surveySchemes.name as scheme',
      'surveys.supportEmail',
      fn.count<number>('userSurveyAliases.id').as('surveyUsers'),
      sql<number>`coalesce(${sql.ref('ssb.submissions')}, 0)`.as('submissions'),
    ])
    .groupBy('surveys.id')
    .groupBy('locales.code')
    .groupBy('locales.localName')
    .groupBy('surveySchemes.name')
    .groupBy('userSurveyAliases.surveyId')
    .groupBy('ssb.submissions')
    .orderBy('surveys.id')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'startDate',
        'endDate',
        'localeCode',
        'localeName',
        'scheme',
        'supportEmail',
        'surveyUsers',
        'submissions',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
