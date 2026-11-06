import type { ResourceOps } from './resource';
import type { UnwrapAII } from '@intake24/common/types';

import { Readable } from 'node:stream';

import { Transform } from '@json2csv/node';
import { format } from 'date-fns';

export async function surveys({ kyselyDb }: ResourceOps) {
  const { total } = await kyselyDb.system.selectFrom('surveys').select(({ fn }) => [
    fn.count<number>('id').as('total'),
  ]).executeTakeFirstOrThrow();
  const cursor = kyselyDb.system
    .selectFrom('surveys')
    .innerJoin('locales', 'locales.id', 'surveys.localeId')
    .innerJoin('surveySchemes', 'surveySchemes.id', 'surveys.surveySchemeId')
    .leftJoin('feedbackSchemes', 'feedbackSchemes.id', 'surveys.feedbackSchemeId')
    .leftJoin('faqs', 'faqs.id', 'surveys.faqId')
    .select(({ fn, selectFrom }) => [
      'surveys.id',
      'surveys.slug',
      'surveys.name',
      'surveys.startDate',
      'surveys.endDate',
      'surveys.state',
      'surveys.supportEmail',
      'surveys.userPersonalIdentifiers',
      'surveys.userCustomFields',
      'surveys.localeId',
      'locales.code as localeCode',
      'locales.localName as localeName',
      'surveys.surveySchemeId',
      'surveySchemes.name as surveySchemeName',
      'surveys.feedbackSchemeId',
      'feedbackSchemes.name as feedbackSchemeName',
      'surveys.faqId',
      'faqs.name as faqName',
      selectFrom('userSurveyAliases as usa')
        .select(fn.count<number>('id').as('count'))
        .whereRef('surveys.id', '=', 'usa.surveyId')
        .as('respondents'),
      selectFrom('surveySubmissions as ss')
        .select(fn.count<number>('id').as('count'))
        .whereRef('surveys.id', '=', 'ss.surveyId')
        .as('submissions'),
    ])
    .orderBy('surveys.id')
    .stream();
  const records = Readable.from(cursor);

  const transform = new Transform(
    {
      fields: [
        'id',
        'slug',
        'name',
        {
          label: 'startDate',
          value: (item: UnwrapAII<typeof cursor>) => format(item.startDate, 'yyyy-MM-dd HH:mm:ss'),
        },
        {
          label: 'endDate',
          value: (item: UnwrapAII<typeof cursor>) => format(item.endDate, 'yyyy-MM-dd HH:mm:ss'),
        },
        'state',
        'supportEmail',
        'userPersonalIdentifiers',
        'userCustomFields',
        'localeId',
        'localeCode',
        'localeName',
        'surveySchemeId',
        'surveySchemeName',
        'feedbackSchemeId',
        'feedbackSchemeName',
        'faqId',
        'faqName',
        'respondents',
        'submissions',
      ],
      withBOM: true,
    },
    {},
    { objectMode: true },
  );

  return { total, records, transform };
}
