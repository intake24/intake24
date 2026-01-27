import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import type { NutrientTableRecordField, NutrientTableRecordNutrient } from '@intake24/db';

import { NotFoundError } from '@intake24/api/http/errors';
import {
  Job as DbJob,
  NutrientTableRecord,
  Op,
  SurveySubmissionFood,
  values,
} from '@intake24/db';

import BaseJob from '../job';

export default class SurveyNutrientsRecalculation extends BaseJob<'SurveyNutrientsRecalculation'> {
  readonly name = 'SurveyNutrientsRecalculation';

  private dbJob!: DbJob;
  private readonly kyselyDb;

  constructor({ kyselyDb, logger }: Pick<IoC, 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.kyselyDb = kyselyDb;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveyNutrientsRecalculation
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.recalculate();

    this.logger.debug('Job finished.');
  }

  private async recalculate(batchSize = 100) {
    const { surveyId } = this.params;

    const total = await SurveySubmissionFood.count({
      include: [{
        association: 'meal',
        required: true,
        include: [{ association: 'submission', where: { surveyId }, required: true }],
      }],
    });

    this.initProgress(total);

    const offsets = [];
    let start = 0;

    while (start < total) {
      offsets.push(start);
      start += batchSize;
    }

    for (const offset of offsets) {
      const difference = batchSize + offset - total;
      const limit = difference > 0 ? batchSize - difference : batchSize;
      const foods = await SurveySubmissionFood.findAll({
        attributes: ['id', 'nutrientTableId', 'nutrientTableCode', 'nutrients', 'portionSize'],
        include: [
          {
            association: 'meal',
            attributes: ['id'],
            required: true,
            include: [
              {
                association: 'submission',
                attributes: ['id'],
                required: true,
                where: { surveyId },
              },
            ],
          },
        ],
        order: [
          ['meal', 'submission', 'submissionTime', 'ASC'],
          ['meal', 'submission', 'id', 'ASC'],
          ['meal', 'hours', 'ASC'],
          ['meal', 'minutes', 'ASC'],
          ['index', 'ASC'],
        ],
        offset,
        limit,
      });

      const nutrientTableRecordIds: Record<string, string[]> = {};
      const portionWeight: number[] = [];

      foods.forEach(({ nutrientTableId, nutrientTableCode, portionSize }) => {
        if (!nutrientTableRecordIds[nutrientTableId])
          nutrientTableRecordIds[nutrientTableId] = [];

        nutrientTableRecordIds[nutrientTableId].push(nutrientTableCode);
        portionWeight.push(Math.abs(Number(portionSize.servingWeight ?? '0') - Number(portionSize.leftoversWeight ?? '0')));
      });

      const conditions = Object.entries(nutrientTableRecordIds).map(
        ([nutrientTableId, nutrientTableRecordId]) => ({ nutrientTableId, nutrientTableRecordId }),
      );

      const nutrientRecords = await NutrientTableRecord.findAll({
        attributes: ['nutrientTableId', 'nutrientTableRecordId'],
        include: [
          { association: 'fields' },
          { association: 'nutrients' },
        ],
        where: conditions.length > 1 ? { [Op.or]: conditions } : conditions[0],
      });

      const nutrientRecordMap = nutrientRecords.reduce<
        Record<
          string,
          { fields: NutrientTableRecordField[]; nutrients: NutrientTableRecordNutrient[] }
        >
      >((acc, item) => {
        acc[`${item.nutrientTableId}:${item.nutrientTableRecordId}`] = {
          fields: item.fields ?? [],
          nutrients: item.nutrients ?? [],
        };
        return acc;
      }, {});

      const records = Object.entries(foods).reduce<{ id: string; fields: string; nutrients: string }[]>((acc, [index, food]) => {
        const { nutrientTableId, nutrientTableCode } = food;

        // Skip if nutrient table is not defined (e.g. recipe builder template)
        if (!nutrientTableId || !nutrientTableCode)
          return acc;

        const key = `${nutrientTableId}:${nutrientTableCode}`;

        const match = nutrientRecordMap[key];
        if (!match) {
          this.logger.warn(`Nutrient record mapping not found.`, { nutrientTableId, nutrientTableCode });
          return acc;
        }

        const fields = match.fields.reduce<Dictionary>((acc, { name, value }) => {
          acc[name] = value;
          return acc;
        }, {});

        const nutrients = match.nutrients.reduce<Dictionary>((acc, { nutrientTypeId, unitsPer100g }) => {
          acc[nutrientTypeId] = (unitsPer100g * portionWeight[Number(index)]) / 100.0;
          return acc;
        }, {});

        acc.push({
          id: food.id,
          fields: JSON.stringify(fields),
          nutrients: JSON.stringify(nutrients),
        });
        return acc;
      }, []);

      if (records.length) {
        await this.kyselyDb.system
          .updateTable('surveySubmissionFoods')
          .from(values(records, 'data'))
          .set(({ cast, ref }) => ({
            fields: cast(ref('data.fields'), 'jsonb'),
            nutrients: cast(ref('data.nutrients'), 'jsonb'),
          }))
          .whereRef('surveySubmissionFoods.id', '=', ({ cast, ref }) => cast(ref('data.id'), 'uuid'))
          .executeTakeFirst();
      }

      await this.incrementProgress(batchSize);
    }
  }
}
