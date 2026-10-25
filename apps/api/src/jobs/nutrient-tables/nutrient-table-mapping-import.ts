import type { Job } from 'bullmq';
import type { Transaction } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';

import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { parse } from 'fast-csv';
import fs from 'fs-extra';
import z from 'zod';
import { fromError } from 'zod-validation-error';

import { batchGenerator } from '@intake24/api/util';
import { bigIntString } from '@intake24/common/types';
import { excelColumnToOffset } from '@intake24/common/util/strings';
import { FoodsNutrientType, NutrientTable, NutrientTableCsvMappingNutrient } from '@intake24/db';

import BaseJob from '../job';

export const csvRow = z.object({
  'Intake24 nutrient ID': bigIntString,
  'NDB spreadsheet column index': z.string().regex(/^[A-Z]+$/).transform(val => val.toUpperCase()),
});
export type CSVRow = z.infer<typeof csvRow>;

export default class NutrientTableMappingImport extends BaseJob<'NutrientTableMappingImport'> {
  readonly name = 'NutrientTableMappingImport';

  private file!: string;

  private readonly db;

  constructor({ logger, db }: Pick<IoC, 'logger' | 'db'>) {
    super({ logger });

    this.db = db;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof NutrientTableMappingImport
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.file = path.resolve(this.params.file);

    this.logger.debug('Job started.');

    const fileExists = await fs.pathExists(this.file);
    if (!fileExists)
      throw new Error(`Missing file (${this.file}).`);

    const nutrientTable = await NutrientTable.findByPk(this.params.nutrientTableId, {
      attributes: ['id'],
    });
    if (!nutrientTable)
      throw new Error(`Nutrient table record not found.`);

    await this.validate();
    await this.import();

    this.logger.debug('Job finished.');
  }

  private async validate(chunk = 100): Promise<void> {
    let totalProcessed = 0;
    const readStream = createReadStream(this.file);
    const csvStream = parse({ headers: true, trim: true });

    await pipeline(
      readStream,
      csvStream,
      async (source: AsyncIterable<CSVRow>) => {
        for await (const batch of batchGenerator(source, chunk)) {
          await this.validateChunk(batch, totalProcessed);
          totalProcessed += batch.length;
        }
      },
    );
  }

  private async validateChunk(data: CSVRow[], offset: number): Promise<void> {
    const result = csvRow.array().safeParse(data);
    if (!result.success) {
      throw fromError({
        ...result.error,
        issues: result.error.issues.map(issue =>
          ({ ...issue, path: issue.path.map(p => typeof p === 'number' ? p + offset : p) })),
      });
    }

    const nutrientIds = data.map(item => item['Intake24 nutrient ID']);
    const count = await FoodsNutrientType.count({ where: { id: nutrientIds } });

    if (nutrientIds.length !== count)
      throw new Error(`Spreadsheet contains some invalid nutrient IDs.`);
  }

  private async import(chunk = 100): Promise<void> {
    const { nutrientTableId } = this.params;

    return await this.db.foods.contextTransaction(async (transaction) => {
      // Clean old data
      await NutrientTableCsvMappingNutrient.destroy({ where: { nutrientTableId }, transaction });

      const readStream = createReadStream(this.file);
      const csvStream = parse({ headers: true, trim: true });

      await pipeline(
        readStream,
        csvStream,
        async (source: AsyncIterable<CSVRow>) => {
          for await (const batch of batchGenerator(source, chunk)) {
            await this.importChunk(batch, transaction);
          }
        },
      );
    });
  }

  private async importChunk(data: CSVRow[], transaction: Transaction): Promise<void> {
    const { nutrientTableId } = this.params;

    const records = data.map((item) => {
      const {
        'Intake24 nutrient ID': nutrientTypeId,
        'NDB spreadsheet column index': columnOffset,
      } = item;

      return {
        nutrientTableId,
        nutrientTypeId,
        columnOffset: excelColumnToOffset(columnOffset),
      };
    });

    await NutrientTableCsvMappingNutrient.bulkCreate(records, { transaction });
    await this.incrementProgress(data.length);
  }
}
