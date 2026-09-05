import type { Job as BullJob } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { finished } from 'node:stream/promises';

import { format, parse } from 'fast-csv';
import fs from 'fs-extra';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, FoodNutrient, NutrientTable, NutrientTableRecord, SystemLocale } from '@intake24/db';

import BaseJob from '../job';

const csvHeaders = ['Locale', 'Food code', 'FCT (NDB name)', 'FCT record ID (NDB Food Code)'];
const associationBatchSize = 200;

type AssociationRow = Record<(typeof csvHeaders)[number], string>;
type AuditRow = AssociationRow & { Outcome: string; Reason: string };
type Stats = { created: number; skipped: number; failed: number };
type AssociateResult = { audit: AuditRow; stat: keyof Stats };
type ReplaceAuditRow = {
  Locale: string;
  'Food code': string;
  'Source FCT (NDB name)': string;
  'FCT record ID (NDB Food Code)': string;
  'Target FCT (NDB name)': string;
  Outcome: string;
  Reason: string;
};

export default class LocaleFoodNutrientAssociation extends BaseJob<'LocaleFoodNutrientAssociation'> {
  readonly name = 'LocaleFoodNutrientAssociation';

  private readonly fsConfig;

  private readonly kyselyDb;

  constructor({ fsConfig, kyselyDb, logger }: Pick<IoC, 'fsConfig' | 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.kyselyDb = kyselyDb;
  }

  public async run(job: BullJob): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    const params = this.params;
    if (params.mode === 'associate')
      await this.associate(dbJob, params.file);
    else
      await this.replace(dbJob, params.sourceNutrientTableId, params.targetNutrientTableId);
  }

  private async associate(dbJob: DbJob, inputFile: string): Promise<void> {
    const file = path.resolve(inputFile);
    if (!await fs.pathExists(file))
      throw new Error(`Missing file (${file}).`);

    const locale = await SystemLocale.findByPk(this.params.localeId, { attributes: ['code'] });
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${this.params.localeId}).`);

    const total = await this.countRows(file);
    const totalBatches = Math.ceil(total / associationBatchSize);
    this.initProgress(totalBatches);

    const filename = `intake24-${this.name}-${locale.code}-${Date.now()}.csv`;
    const report = format<AuditRow, AuditRow>({ headers: [...csvHeaders, 'Outcome', 'Reason'], writeBOM: true });
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    report.pipe(output);

    const stats: Stats = { created: 0, skipped: 0, failed: 0 };
    const plannedPairs = new Set<string>();
    let batch: AssociationRow[] = [];
    let completedBatches = 0;
    const processBatch = async () => {
      const batchStats = await this.associateBatch(batch, locale.code, plannedPairs, report);
      stats.created += batchStats.created;
      stats.skipped += batchStats.skipped;
      stats.failed += batchStats.failed;
      completedBatches++;
      batch = [];
    };
    const progressInterval = setInterval(async () => {
      await this.setProgress(completedBatches);
    }, 2000);

    try {
      for await (const row of this.rows(file)) {
        batch.push(row as AssociationRow);
        if (batch.length < associationBatchSize)
          continue;

        await processBatch();
      }

      if (batch.length)
        await processBatch();

      report.end();
      await finished(output);
      await this.setProgress(completedBatches);

      await dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
        message: `Locale food nutrient association: ${this.params.dryRun ? 'would create' : 'created'} ${stats.created}, skipped ${stats.skipped}, failed ${stats.failed}.`,
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }

  private rows(file: string) {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const decode = (chunk?: Buffer, stream = false) => {
      try {
        return decoder.decode(chunk, { stream });
      }
      catch (error) {
        throw new Error('CSV file is not valid UTF-8.', { cause: error });
      }
    };
    const decoded = createReadStream(file).pipe(new Transform({
      transform: (chunk: Buffer, _encoding, callback) => callback(null, decode(chunk, true)),
      flush: callback => callback(null, decode()),
    }));
    const parser = decoded.pipe(parse({
      headers: (headers) => {
        this.validateHeaders(headers);
        return headers;
      },
      trim: true,
      ignoreEmpty: true,
    }));
    return parser;
  }

  private async countRows(file: string): Promise<number> {
    let count = 0;
    let headersFound = false;
    const rows = this.rows(file);
    rows.on('headers', () => {
      headersFound = true;
    });

    for await (const _ of rows)
      count++;

    if (!headersFound)
      throw new Error(`Missing required CSV headers (${csvHeaders.join(', ')}).`);

    return count;
  }

  private validateHeaders(headers: Array<string | null | undefined>) {
    if (csvHeaders.some(header => !headers.includes(header)))
      throw new Error(`Missing required CSV headers (${csvHeaders.join(', ')}).`);
  }

  private async associateBatch(
    rows: AssociationRow[],
    localeCode: string,
    plannedPairs: Set<string>,
    report: ReturnType<typeof format<AuditRow, AuditRow>>,
  ): Promise<Stats> {
    const results = new Map<AssociationRow, AssociateResult>();
    const validRows: AssociationRow[] = [];
    const reportResult = (row: AssociationRow, stat: keyof Stats, outcome: string, reason = '') => {
      results.set(row, { stat, audit: { ...row, Outcome: outcome, Reason: reason } });
    };

    for (const row of rows) {
      const invalidField = csvHeaders.find(header => !row[header]);
      if (invalidField) {
        reportResult(row, 'failed', 'failed', `Missing value for ${invalidField}.`);
        continue;
      }
      validRows.push(row);
    }

    const foodCodes = [...new Set(validRows.map(row => row['Food code']))];
    const nutrientTableIds = [...new Set(validRows.map(row => row['FCT (NDB name)']))];
    const nutrientTableRecordIds = [...new Set(validRows.map(row => row['FCT record ID (NDB Food Code)']))];

    const [foods, nutrientTables, nutrientTableRecords] = await Promise.all([
      this.kyselyDb.foods
        .selectFrom('foods')
        .select(['id', 'code'])
        .where('localeId', '=', localeCode)
        .where('code', 'in', foodCodes)
        .execute(),
      this.kyselyDb.foods
        .selectFrom('nutrientTables')
        .select('id')
        .where('id', 'in', nutrientTableIds)
        .execute(),
      this.kyselyDb.foods
        .selectFrom('nutrientTableRecords')
        .select(['id', 'nutrientTableId', 'nutrientTableRecordId'])
        .where('nutrientTableId', 'in', nutrientTableIds)
        .where('nutrientTableRecordId', 'in', nutrientTableRecordIds)
        .execute(),
    ]);

    const foodsByCode = new Map(foods.map(food => [food.code, food]));
    const nutrientTablesById = new Map(nutrientTables.map(table => [table.id, table]));
    const recordsByReference = new Map(
      nutrientTableRecords.map(record => [`${record.nutrientTableId}:${record.nutrientTableRecordId}`, record]),
    );
    const candidates: Array<{ row: AssociationRow; foodId: string; nutrientTableRecordId: string; pair: string }> = [];

    for (const row of validRows) {
      if (row.Locale !== localeCode) {
        reportResult(row, 'failed', 'failed', `Locale does not match selected locale (${localeCode}).`);
        continue;
      }

      const food = foodsByCode.get(row['Food code']);
      if (!food) {
        reportResult(row, 'failed', 'failed', 'Food not found in the selected locale.');
        continue;
      }

      if (!nutrientTablesById.has(row['FCT (NDB name)'])) {
        reportResult(row, 'failed', 'failed', 'Nutrient table not found.');
        continue;
      }

      const record = recordsByReference.get(`${row['FCT (NDB name)']}:${row['FCT record ID (NDB Food Code)']}`);
      if (!record) {
        reportResult(row, 'failed', 'failed', 'FCT record ID not found in the specified nutrient table.');
        continue;
      }

      const pair = `${food.id}:${record.id}`;
      if (plannedPairs.has(pair)) {
        reportResult(row, 'skipped', 'skipped', 'Association already exists.');
        continue;
      }

      plannedPairs.add(pair);
      candidates.push({ row, foodId: food.id, nutrientTableRecordId: record.id, pair });
    }

    const existingPairs = this.params.dryRun || !candidates.length
      ? new Set<string>()
      : new Set((await this.kyselyDb.foods
          .selectFrom('foodsNutrients')
          .select(['foodId', 'nutrientTableRecordId'])
          .where('foodId', 'in', candidates.map(candidate => candidate.foodId))
          .where('nutrientTableRecordId', 'in', candidates.map(candidate => candidate.nutrientTableRecordId))
          .execute()).map(association => `${association.foodId}:${association.nutrientTableRecordId}`));
    const newAssociations = candidates.filter(candidate => !existingPairs.has(candidate.pair));

    if (!this.params.dryRun && newAssociations.length) {
      await this.kyselyDb.foods
        .insertInto('foodsNutrients')
        .values(newAssociations.map(({ foodId, nutrientTableRecordId }) => ({ foodId, nutrientTableRecordId })))
        .onConflict(oc => oc
          .columns(['foodId', 'nutrientTableRecordId'])
          .doNothing())
        .execute();
    }

    for (const candidate of candidates) {
      if (existingPairs.has(candidate.pair))
        reportResult(candidate.row, 'skipped', 'skipped', 'Association already exists.');
      else
        reportResult(candidate.row, 'created', this.params.dryRun ? 'would create' : 'created');
    }

    const stats: Stats = { created: 0, skipped: 0, failed: 0 };
    for (const row of rows) {
      const result = results.get(row);
      if (!result)
        throw new Error('Association result missing.');
      stats[result.stat]++;
      await this.writeReportRow(report, result.audit);
    }
    return stats;
  }

  private async writeReportRow(report: ReturnType<typeof format<AuditRow, AuditRow>>, row: AuditRow) {
    if (!report.write(row))
      await once(report, 'drain');
  }

  private async replace(dbJob: DbJob, sourceNutrientTableId: string, targetNutrientTableId: string): Promise<void> {
    if (sourceNutrientTableId === targetNutrientTableId)
      throw new Error('Source and target nutrient tables must be different.');

    const [locale, sourceTable, targetTable] = await Promise.all([
      SystemLocale.findByPk(this.params.localeId, { attributes: ['code'] }),
      NutrientTable.findByPk(sourceNutrientTableId, { attributes: ['id'] }),
      NutrientTable.findByPk(targetNutrientTableId, { attributes: ['id'] }),
    ]);
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${this.params.localeId}).`);
    if (!sourceTable || !targetTable)
      throw new Error('Nutrient table not found.');

    const sourceMappings = this.kyselyDb.foods
      .selectFrom('foodsNutrients')
      .innerJoin('foods', 'foodsNutrients.foodId', 'foods.id')
      .innerJoin('nutrientTableRecords', 'foodsNutrients.nutrientTableRecordId', 'nutrientTableRecords.id')
      .select([
        'foodsNutrients.foodId',
        'foodsNutrients.nutrientTableRecordId',
        'foods.code as foodCode',
        'nutrientTableRecords.nutrientTableRecordId as sourceRecordId',
      ])
      .where('foods.localeId', '=', locale.code)
      .where('nutrientTableRecords.nutrientTableId', '=', sourceNutrientTableId);
    const { total } = await sourceMappings
      .clearSelect()
      .select(({ fn }) => fn.count<number>('foodsNutrients.foodId').as('total'))
      .executeTakeFirstOrThrow();
    this.initProgress(Number(total));
    if (!Number(total)) {
      const action = this.params.dryRun ? 'would replace' : 'replaced';
      await dbJob.update({
        message: `Locale food nutrient association: found 0 source associations, ${action} 0, failed 0.`,
      });
      return;
    }

    const filename = `intake24-${this.name}-${locale.code}-${Date.now()}.csv`;
    const headers = ['Locale', 'Food code', 'Source FCT (NDB name)', 'FCT record ID (NDB Food Code)', 'Target FCT (NDB name)', 'Outcome', 'Reason'];
    const report = format<ReplaceAuditRow, ReplaceAuditRow>({ headers, writeBOM: true });
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    report.pipe(output);

    let found = 0;
    let replaced = 0;
    let failed = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(found);
    }, 2000);

    try {
      for await (const mapping of sourceMappings.stream()) {
        const targetRecord = await NutrientTableRecord.findOne({
          where: { nutrientTableId: targetNutrientTableId, nutrientTableRecordId: mapping.sourceRecordId },
          attributes: ['id'],
        });
        const row: ReplaceAuditRow = {
          Locale: locale.code,
          'Food code': mapping.foodCode,
          'Source FCT (NDB name)': sourceNutrientTableId,
          'FCT record ID (NDB Food Code)': mapping.sourceRecordId,
          'Target FCT (NDB name)': targetNutrientTableId,
          Outcome: '',
          Reason: '',
        };

        if (!targetRecord) {
          row.Outcome = 'failed';
          row.Reason = 'FCT record ID not found in target nutrient table.';
          failed++;
        }
        else if (this.params.dryRun) {
          row.Outcome = 'would replace';
          replaced++;
        }
        else {
          const [, created] = await FoodNutrient.findOrCreate({
            where: { foodId: mapping.foodId, nutrientTableRecordId: targetRecord.id },
          });
          await FoodNutrient.destroy({
            where: { foodId: mapping.foodId, nutrientTableRecordId: mapping.nutrientTableRecordId },
          });
          row.Outcome = 'replaced';
          row.Reason = created ? '' : 'Target mapping already existed.';
          replaced++;
        }

        if (!report.write(row))
          await once(report, 'drain');
        found++;
      }

      report.end();
      await finished(output);
      await this.setProgress(found);

      const action = this.params.dryRun ? 'would replace' : 'replaced';
      await dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
        message: `Locale food nutrient association: found ${found} source associations, ${action} ${replaced}, failed ${failed}.`,
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }
}
