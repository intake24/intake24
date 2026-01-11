import type { Job } from 'bullmq';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { parse } from 'fast-csv';
import fs from 'fs-extra';

import type { IoC } from '@intake24/api/ioc';
import { excelColumnToOffset } from '@intake24/common/util/strings';
import { FoodsNutrientType, NutrientTable, NutrientTableCsvMappingNutrient } from '@intake24/db';

import StreamLockJob from '../stream-lock-job';

export type CSVRow = {
  'Intake24 nutrient ID': string;
  'NDB spreadsheet column index': string;
};

const requiredFields = ['Intake24 nutrient ID', 'NDB spreadsheet column index'];

export default class NutrientTableMappingImport extends StreamLockJob<'NutrientTableMappingImport'> {
  readonly name = 'NutrientTableMappingImport';

  private file!: string;

  private content: CSVRow[] = [];

  constructor({ logger }: Pick<IoC, 'logger'>) {
    super({ logger });
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

  /**
   * Read CSV file and validate in chunks
   *
   * @private
   * @param {number} [chunk]
   * @returns {Promise<void>}
   * @memberof NutrientTableMappingImport
   */
  private async validate(chunk = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(this.file).pipe(parse({ headers: true, trim: true }));

      stream
        .on('data', (row: CSVRow) => {
          this.content.push(row);

          if (chunk > 0 && this.content.length === chunk) {
            stream.pause();
            this.validateChunk()
              .then(() => {
                stream.resume();
              })
              .catch((err) => {
                stream.destroy(err);
                reject(err);
              });
          }
        })
        .on('end', async (records: number) => {
          this.initProgress(records);
          await this.waitForUnlock();

          this.validateChunk()
            .then(() => resolve())
            .catch((err) => {
              stream.destroy(err);
              reject(err);
            });
        })
        .on('error', err => reject(err));
    });
  }

  /**
   * Chunk validator. It validates:
   * - presence of required fields
   * - username / survey alias uniqueness within survey
   * - email uniqueness within system
   *
   * @private
   * @returns {Promise<void>}
   * @memberof NutrientTableMappingImport
   */
  private async validateChunk(): Promise<void> {
    if (!this.content.length)
      return;

    this.lock();

    const csvFields = Object.keys(this.content[0]);

    // Check for presence of required fields
    if (requiredFields.some(field => !csvFields.includes(field)))
      throw new Error(`Missing some of the required fields (${requiredFields.join(',')}).`);

    const nutrientIds = this.content.map(item => item['Intake24 nutrient ID']);
    const count = await FoodsNutrientType.count({ where: { id: nutrientIds } });

    if (nutrientIds.length !== count)
      throw new Error(`Spreadsheet contains some invalid nutrient IDs.`);

    this.content = [];
    this.unlock();
  }

  /**
   * Read CSV file and import in chunks
   *
   * @private
   * @param {number} [chunk]
   * @returns {Promise<void>}
   * @memberof NutrientTableMappingImport
   */
  private async import(chunk = 100): Promise<void> {
    const { nutrientTableId } = this.params;

    // Clean old data
    await NutrientTableCsvMappingNutrient.destroy({ where: { nutrientTableId } });

    return new Promise((resolve, reject) => {
      const stream = createReadStream(this.file).pipe(parse({ headers: true, trim: true }));

      stream
        .on('data', (row: CSVRow) => {
          this.content.push(row);

          if (chunk > 0 && this.content.length === chunk) {
            stream.pause();
            this.importChunk()
              .then(() => {
                stream.resume();
              })
              .catch((err) => {
                stream.destroy(err);
                reject(err);
              });
          }
        })
        .on('end', async () => {
          await this.waitForUnlock();

          this.importChunk()
            .then(() => resolve())
            .catch((err) => {
              stream.destroy(err);
              reject(err);
            });
        })
        .on('error', err => reject(err));
    });
  }

  /**
   * Chunk importer
   *
   * @private
   * @returns {Promise<void>}
   * @memberof NutrientTableMappingImport
   */
  private async importChunk(): Promise<void> {
    if (!this.content.length)
      return;

    this.lock();

    const { nutrientTableId } = this.params;

    const records = this.content.map((item) => {
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

    await NutrientTableCsvMappingNutrient.bulkCreate(records);

    await this.incrementProgress(this.content.length);

    this.content = [];
    this.unlock();
  }
}
