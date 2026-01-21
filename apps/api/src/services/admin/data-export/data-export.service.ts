import type { ExportFieldInfo, ExportRow } from './data-export-fields';
import { Readable } from 'node:stream';
import { Transform } from '@json2csv/node';
import { format as formatDate } from 'date-fns';
import { groupBy } from 'lodash-es';
import { literal } from 'sequelize';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { ExportSection } from '@intake24/common/surveys';
import type { JobParams } from '@intake24/common/types';
import type {
  IncludeOptions,
  Job,
  Order,
  StreamFindOptions,
  SurveySubmissionAttributes,
  WhereOptions,
} from '@intake24/db';
import {
  Op,
  Survey,
  SurveySubmissionFood,
  SurveySubmissionMeal,
  SurveySubmissionMissingFood,
} from '@intake24/db';

export type DataExportInput = JobParams['SurveyDataExport'];

export type SubmissionFindOptions = Record<'foods' | 'missingFoods' | 'meals', StreamFindOptions>;

export type DataExportOptions = {
  options: SubmissionFindOptions;
  fields: ExportFieldInfo[];
  filename: string;
  total: number;
};

export type SyncStreamOutput = {
  filename: string;
  stream: Transform<SurveySubmissionFood, ExportRow>;
};

function dataExportService({
  dataExportMapper,
  scheduler,
}: Pick<IoC, 'dataExportMapper' | 'scheduler'>) {
  /**
   * Scope to query submission foods and missing foods records
   *
   * @param {DataExportInput} options
   * @returns {SubmissionScopes}
   */
  const getSubmissionOptions = ({
    surveyId,
    id,
    startDate,
    endDate,
  }: DataExportInput): SubmissionFindOptions => {
    const surveySubmissionConditions: WhereOptions<SurveySubmissionAttributes> = { surveyId };
    if (id)
      surveySubmissionConditions.id = id;

    if (startDate || endDate) {
      const submissionTime = {
        [Op.and]: [
          startDate ? { [Op.gte]: startDate } : null,
          endDate ? { [Op.lte]: endDate } : null,
        ].filter(Boolean),
      };

      surveySubmissionConditions.submissionTime = submissionTime;
    }

    const include: IncludeOptions[] = [
      {
        association: 'meal',
        required: true,
        include: [
          {
            association: 'submission',
            required: true,
            where: surveySubmissionConditions,
            include: [
              { association: 'survey', required: true },
              {
                association: 'user',
                required: true,
                include: [
                  { association: 'aliases', where: { surveyId }, separate: true },
                  { association: 'customFields', separate: true },
                ],
              },
            ],
          },
        ],
      },
      { association: 'externalSources', separate: true },
    ];

    const meals: StreamFindOptions = {
      attributes: [
        'id',
        'surveySubmissionId',
        'hours',
        'minutes',
        'name',
        'duration',
        [literal(`CASE WHEN submission.wake_up_time is not null and CONCAT(hours, ':', minutes)::time < submission.wake_up_time THEN CONCAT(hours,':',minutes)::interval  + '1440m'::interval ELSE CONCAT(hours,':',minutes)::interval end`), 'interval'],
      ],
      include: [{ association: 'submission', required: true, where: surveySubmissionConditions }],
      order: [
        ['submission', 'submissionTime', 'ASC'],
        ['submission', 'id', 'ASC'],
        ['interval', 'ASC'],
        ['name', 'ASC'],
        /*
        * Ensure order for pagination (offset/limit)
        * - meal hours, minutes and name are not unique and same
        * - todo: UUIDv4 is not ordered -> use UUIDv7
        */
        ['id', 'ASC'],
      ],
    };

    const order: Order = [
      ['meal', 'submission', 'submissionTime', 'ASC'],
      ['meal', 'submission', 'id', 'ASC'],
      ['meal', 'hours', 'ASC'],
      ['meal', 'minutes', 'ASC'],
      ['index', 'ASC'],
    ];

    const foods = {
      include,
      order,
    };

    const missingFoods = { include, order };

    return { meals, foods, missingFoods };
  };

  /**
   * Query the foods | missing foods and push to stream
   *
   * @param {Readable} inputStream
   * @param {SubmissionFindOptions} options
   * @returns {Promise<void>}
   */
  const performSubmissionsSearch = async (
    inputStream: Readable,
    options: SubmissionFindOptions,
  ): Promise<void> => {
    const {
      batchSize = 25,
      limit,
      offset: startOffset = 0,
      attributes,
      ...params
    } = options.meals;

    try {
      const max = limit ?? (await SurveySubmissionMeal.count(params));

      const offsets = [];
      let start = startOffset;

      while (start < max) {
        offsets.push(start);
        start += batchSize;
      }

      let currentIndex = 0;

      for (const offset of offsets) {
        const difference = batchSize + offset - max;
        const meals = await SurveySubmissionMeal.findAll({
          ...params,
          attributes,
          offset,
          limit: difference > 0 ? batchSize - difference : batchSize,
        });

        const mealId: string[] = [];
        const mealIndex: Record<string, number> = {};

        const mealCount = meals.length;
        meals.forEach(({ id, surveySubmissionId }, index, array) => {
          mealId.push(id);
          mealIndex[id] = currentIndex;

          currentIndex++;

          if (index + 1 < mealCount && surveySubmissionId !== array.at(index + 1)?.surveySubmissionId)
            currentIndex = 0;
        });

        const [foods, missingFoods] = await Promise.all([
          SurveySubmissionFood.findAll({ ...options.foods, where: { mealId } }),
          SurveySubmissionMissingFood.findAll({ ...options.missingFoods, where: { mealId } }),
        ]);

        const groupedFoods = groupBy(foods, 'mealId');
        const groupedMissingFoods = groupBy(missingFoods, 'mealId');

        for (const id of mealId) {
          [...(groupedFoods[id] ?? []), ...(groupedMissingFoods[id] ?? [])]
            .sort(({ index: a }, { index: b }) => a - b)
            .forEach(food => inputStream.push({ food, custom: { mealIndex: mealIndex[id] } }));
        }
      }

      inputStream.push(null);
    }
    catch (err) {
      inputStream.destroy(err instanceof Error ? err : undefined);
    }
  };

  /**
   * Get streamed submissions
   *
   * @param {SubmissionFindOptions} options
   * @returns {Readable}
   */
  const getSubmissionsWithStream = (options: SubmissionFindOptions): Readable => {
    const inputStream = new Readable({ objectMode: true });
    inputStream._read = () => {};

    performSubmissionsSearch(inputStream, options);

    return inputStream;
  };

  /**
   * Sort and prepare export fields
   *
   * @param {ExportSection[]} sections
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const getExportFields = async (sections: ExportSection[]): Promise<ExportFieldInfo[]> => {
    const fields: ExportFieldInfo[] = [];

    for (const section of sections)
      fields.push(...(await dataExportMapper[section.id](section.id, section.fields)));

    return fields;
  };

  /**
   * Prepare export output info
   *
   * @param {DataExportInput} input
   * @returns {Promise<DataExportOptions>}
   */
  const prepareExportInfo = async (input: DataExportInput): Promise<DataExportOptions> => {
    const { surveyId } = input;

    const survey = await Survey.findByPk(surveyId, {
      attributes: ['id', 'slug'],
      include: [{ association: 'surveyScheme', attributes: ['dataExport'], required: true }],
    });
    if (!survey || !survey.surveyScheme)
      throw new NotFoundError();

    const { slug, surveyScheme } = survey;
    const options = getSubmissionOptions(input);
    const fields = await getExportFields(surveyScheme.dataExport);
    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-survey-data-export-${slug}-${timestamp}.csv`;

    const [totalFoods, totalMissingFoods] = await Promise.all([
      SurveySubmissionFood.count(options.foods),
      SurveySubmissionMissingFood.count(options.missingFoods),
    ]);

    return { options, fields, filename, total: totalFoods + totalMissingFoods };
  };

  /**
   * Push data export job to queue
   *
   * @param {DataExportInput} input
   * @returns {Promise<Job>}
   */
  const queueExportJob = async (input: DataExportInput): Promise<Job> => {
    const { userId, ...params } = input;

    return scheduler.jobs.addJob({ type: 'SurveyDataExport', userId, params });
  };

  /**
   * Generate CSV stream for http response
   *
   * @param {DataExportInput} input
   * @returns {Promise<SyncStreamOutput>}
   */
  const syncStream = async (input: DataExportInput): Promise<SyncStreamOutput> => {
    const { options, fields, filename } = await prepareExportInfo(input);

    const foods = SurveySubmissionFood.findAllWithStream(options.foods);
    const transform = new Transform({ fields, withBOM: true }, {}, { objectMode: true });

    foods.on('error', (err) => {
      throw err;
    });

    transform.on('error', (err) => {
      throw err;
    });

    const stream = foods.pipe(transform);

    return { filename, stream };
  };

  return {
    getSubmissionOptions,
    getSubmissionsWithStream,
    getExportFields,
    prepareExportInfo,
    queueExportJob,
    syncStream,
  };
}

export default dataExportService;

export type DataExportService = ReturnType<typeof dataExportService>;
