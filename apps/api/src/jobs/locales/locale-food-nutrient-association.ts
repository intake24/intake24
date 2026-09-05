import type { Job as BullJob } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { finished } from 'node:stream/promises';

import { format, parse } from 'fast-csv';
import fs from 'fs-extra';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Food, FoodNutrient, NutrientTable, NutrientTableRecord, SystemLocale } from '@intake24/db';

import BaseJob from '../job';

const csvHeaders = ['Locale', 'Food code', 'FCT (NDB name)', 'FCT record ID (NDB Food Code)'];

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
    this.initProgress(total);

    const filename = `intake24-${this.name}-${locale.code}-${Date.now()}.csv`;
    const report = format<AuditRow, AuditRow>({ headers: [...csvHeaders, 'Outcome', 'Reason'], writeBOM: true });
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    report.pipe(output);

    const stats: Stats = { created: 0, skipped: 0, failed: 0 };
    const plannedPairs = new Set<string>();
    let processed = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(processed);
    }, 2000);

    try {
      for await (const row of this.rows(file)) {
        const result = await this.associateRow(row as AssociationRow, locale.code, plannedPairs);
        stats[result.stat]++;
        await this.writeReportRow(report, result.audit);
        processed++;
      }

      report.end();
      await finished(output);
      await this.setProgress(processed);

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
    return createReadStream(file).pipe(parse({
      headers: (headers) => {
        this.validateHeaders(headers);
        return headers;
      },
      trim: true,
      ignoreEmpty: true,
    }));
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

  private async associateRow(row: AssociationRow, localeCode: string, plannedPairs: Set<string>): Promise<AssociateResult> {
    const report = (stat: keyof Stats, outcome: string, reason = ''): AssociateResult => ({
      stat,
      audit: { ...row, Outcome: outcome, Reason: reason },
    });
    const csvLocale = row.Locale;
    const foodCode = row['Food code'];
    const nutrientTableId = row['FCT (NDB name)'];
    const nutrientTableRecordId = row['FCT record ID (NDB Food Code)'];

    if (csvLocale !== localeCode)
      return report('failed', 'failed', `Locale does not match selected locale (${localeCode}).`);

    const food = await Food.findOne({ where: { localeId: localeCode, code: foodCode }, attributes: ['id'] });
    if (!food)
      return report('failed', 'failed', 'Food not found in the selected locale.');

    const nutrientTable = await NutrientTable.findByPk(nutrientTableId, { attributes: ['id'] });
    if (!nutrientTable)
      return report('failed', 'failed', 'Nutrient table not found.');

    const nutrientTableRecord = await NutrientTableRecord.findOne({
      where: { nutrientTableId, nutrientTableRecordId },
      attributes: ['id'],
    });
    if (!nutrientTableRecord)
      return report('failed', 'failed', 'FCT record ID not found in the specified nutrient table.');

    const pair = `${food.id}:${nutrientTableRecord.id}`;
    if (plannedPairs.has(pair))
      return report('skipped', 'skipped', 'Association already exists.');

    if (this.params.dryRun) {
      plannedPairs.add(pair);
      return report('created', 'would create');
    }

    const [, created] = await FoodNutrient.findOrCreate({
      where: { foodId: food.id, nutrientTableRecordId: nutrientTableRecord.id },
    });
    plannedPairs.add(pair);

    return created
      ? report('created', 'created')
      : report('skipped', 'skipped', 'Association already exists.');
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
