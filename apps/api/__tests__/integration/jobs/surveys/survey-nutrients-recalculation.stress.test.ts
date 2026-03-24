/* eslint-disable perfectionist/sort-imports */
import '@intake24/api/bootstrap';

import { randomUUID } from 'node:crypto';

import { Job as BullJob } from 'bullmq';
import { vi } from 'vitest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import {
  Job as DbJob,
  Food,
  FoodNutrient,
  NutrientTable,
  NutrientTableRecord,
  NutrientTableRecordField,
  NutrientTableRecordNutrient,
  SurveySubmission,
  SurveySubmissionFood,
  SurveySubmissionMeal,
} from '@intake24/db';

type RecalculationMode = 'none' | 'values-only' | 'values-and-codes';
type RecalculationJobParams = { surveyId: string; mode: RecalculationMode; syncFields?: boolean };

function createMockBullJob(dbJobId: string, params: RecalculationJobParams): BullJob {
  return {
    id: `db-${dbJobId}`,
    data: { params },
    updateProgress: vi.fn(),
    returnvalue: null,
  } as unknown as BullJob;
}

const localeId = 'en_GB';
const userId = () => suite.data.system.user.id;
const surveyId = () => suite.data.system.Survey.id;

describe('conduct SurveyNutrientsRecalculation stress test', () => {
  beforeAll(async () => {
    await suite.init();
  }, 60_000);

  afterAll(async () => {
    await suite.close();
  }, 60_000);

  const SUBMISSIONS = 2500;
  const FOODS_PER_SUBMISSION = 40;
  const TOTAL_FOODS = SUBMISSIONS * FOODS_PER_SUBMISSION; // 100,000
  const UNIQUE_CODES = 25_000;
  const BULK_CHUNK = 1000;
  const DESTROY_CHUNK = 5000;
  const STRESS_TIMEOUT = 600_000;

  let stressNutrientTable: NutrientTable | null = null;
  let stressRecord: NutrientTableRecord | null = null;
  let stressRecordNutrient: NutrientTableRecordNutrient | null = null;
  let stressRecordField: NutrientTableRecordField | null = null;
  let stressFoodModelIds: string[] = [];
  let stressSubmissionIds: string[] = [];
  let stressMealIds: string[] = [];
  const stressDbJobIds: string[] = [];

  const bulkCreate = async <T>(
    Model: { bulkCreate: (rows: any[], options?: any) => Promise<T[]> },
    rows: any[],
  ): Promise<T[]> => {
    const results: T[] = [];
    for (let offset = 0; offset < rows.length; offset += BULK_CHUNK) {
      const created = await Model.bulkCreate(rows.slice(offset, offset + BULK_CHUNK));
      results.push(...created);
    }
    return results;
  };

  const bulkDestroy = async (
    Model: { destroy: (opts: any) => Promise<number> },
    ids: string[],
    field: string,
  ) => {
    for (let offset = 0; offset < ids.length; offset += DESTROY_CHUNK)
      await Model.destroy({ where: { [field]: ids.slice(offset, offset + DESTROY_CHUNK) } });
  };

  beforeAll(async () => {
    const ntId = `NT_STRESS_${Date.now()}`;
    stressNutrientTable = await NutrientTable.create({ id: ntId, description: 'Stress test table' });

    stressRecord = await NutrientTableRecord.create({
      nutrientTableId: ntId,
      nutrientTableRecordId: 'SR',
      name: 'Stress Record',
      localName: 'Stress Record',
    });

    stressRecordNutrient = await NutrientTableRecordNutrient.create({
      nutrientTableRecordId: stressRecord.id,
      nutrientTypeId: '1',
      unitsPer100g: 50,
    });

    stressRecordField = await NutrientTableRecordField.create({
      nutrientTableRecordId: stressRecord.id,
      name: 'sub_group_code',
      value: '62R',
    });

    // Bulk create UNIQUE_CODES Food records and their nutrient mappings
    const foodRows = Array.from({ length: UNIQUE_CODES }, (_, i) => ({
      code: `STR${String(i).padStart(6, '0')}`,
      localeId,
      name: `Stress Food ${i}`,
      englishName: `Stress Food ${i}`,
      version: randomUUID(),
      tags: [],
    }));
    const createdFoodModels = await bulkCreate<Food>(Food, foodRows);
    stressFoodModelIds = createdFoodModels.map(f => f.id);

    const foodNutrientRows = stressFoodModelIds.map(foodId => ({
      foodId,
      nutrientTableRecordId: stressRecord!.id,
    }));
    await bulkCreate<FoodNutrient>(FoodNutrient, foodNutrientRows);

    const now = new Date();

    // Bulk create SUBMISSIONS submissions
    const submissionRows: object[] = [];
    for (let i = 0; i < SUBMISSIONS; i++) {
      submissionRows.push({
        id: randomUUID(),
        surveyId: surveyId(),
        userId: userId(),
        startTime: now,
        endTime: now,
        submissionTime: now,
        sessionId: randomUUID(),
        customData: {},
      });
    }
    const createdSubmissions = await bulkCreate<SurveySubmission>(SurveySubmission, submissionRows);
    stressSubmissionIds = createdSubmissions.map(s => s.id);

    // Bulk create one meal per submission
    const mealRows = stressSubmissionIds.map(submissionId => ({
      id: randomUUID(),
      surveySubmissionId: submissionId,
      hours: 8,
      minutes: 0,
      name: 'Breakfast',
      duration: null,
      customData: {},
    }));
    const createdMeals = await bulkCreate<SurveySubmissionMeal>(SurveySubmissionMeal, mealRows);
    stressMealIds = createdMeals.map(m => m.id);

    // Bulk create FOODS_PER_SUBMISSION foods per meal — round-robin across UNIQUE_CODES food codes
    const submissionFoodRows: object[] = [];
    for (let s = 0; s < SUBMISSIONS; s++) {
      for (let f = 0; f < FOODS_PER_SUBMISSION; f++) {
        const codeIndex = (s * FOODS_PER_SUBMISSION + f) % UNIQUE_CODES;
        submissionFoodRows.push({
          id: randomUUID(),
          mealId: stressMealIds[s],
          index: f,
          code: `STR${String(codeIndex).padStart(6, '0')}`,
          englishName: `Stress Food ${codeIndex}`,
          localName: `Stress Food ${codeIndex}`,
          locale: localeId,
          readyMeal: false,
          searchTerm: 'food',
          portionSizeMethodId: 'standard-portion',
          reasonableAmount: true,
          brand: null,
          nutrientTableId: ntId,
          nutrientTableCode: stressRecord!.nutrientTableRecordId,
          barcode: null,
          fields: { sub_group_code: '62R' },
          nutrients: { 1: 100 },
          portionSize: {
            method: 'standard-portion',
            conversionFactor: 1,
            servingWeight: 100,
            leftoversWeight: 0,
            unit: null,
            quantity: 1,
            linkedQuantity: 1,
          },
          customData: {},
        });
      }
    }
    await bulkCreate<SurveySubmissionFood>(SurveySubmissionFood, submissionFoodRows);
  }, STRESS_TIMEOUT);

  afterAll(async () => {
    if (stressDbJobIds.length)
      await DbJob.destroy({ where: { id: stressDbJobIds } });
    if (stressMealIds.length)
      await bulkDestroy(SurveySubmissionFood as any, stressMealIds, 'mealId');
    if (stressMealIds.length)
      await bulkDestroy(SurveySubmissionMeal as any, stressMealIds, 'id');
    if (stressSubmissionIds.length)
      await bulkDestroy(SurveySubmission as any, stressSubmissionIds, 'id');
    if (stressFoodModelIds.length) {
      await bulkDestroy(FoodNutrient as any, stressFoodModelIds, 'foodId');
      await bulkDestroy(Food as any, stressFoodModelIds, 'id');
    }
    if (stressRecordField)
      await stressRecordField.destroy();
    if (stressRecordNutrient)
      await stressRecordNutrient.destroy();
    if (stressRecord)
      await stressRecord.destroy();
    if (stressNutrientTable)
      await stressNutrientTable.destroy();
  }, STRESS_TIMEOUT);

  const measureScenario = async (label: string, params: RecalculationJobParams) => {
    const createdDbJob = await DbJob.create({
      type: 'SurveyNutrientsRecalculation',
      userId: userId(),
      params,
    });
    stressDbJobIds.push(createdDbJob.id);

    // GC and snapshot memory immediately before the recalculation job only
    if (globalThis.gc)
      globalThis.gc();

    const memBefore = process.memoryUsage();
    let peakHeap = memBefore.heapUsed;
    let peakRss = memBefore.rss;

    const poller = setInterval(() => {
      const m = process.memoryUsage();
      if (m.heapUsed > peakHeap)
        peakHeap = m.heapUsed;
      if (m.rss > peakRss)
        peakRss = m.rss;
    }, 50);

    const t0 = Date.now();
    const job = ioc.resolve('SurveyNutrientsRecalculation');
    await job.run(createMockBullJob(createdDbJob.id, params));
    const elapsedMs = Date.now() - t0;

    clearInterval(poller);

    if (globalThis.gc)
      globalThis.gc();

    const memAfter = process.memoryUsage();
    const toMB = (b: number) => (b / 1024 / 1024).toFixed(1);
    const rps = ((TOTAL_FOODS / elapsedMs) * 1000).toFixed(0);

    console.log(`\n[stress] ${label}`);
    console.log(`  submissions     : ${SUBMISSIONS} × ${FOODS_PER_SUBMISSION} foods = ${TOTAL_FOODS} total (${UNIQUE_CODES} unique codes, ~${(TOTAL_FOODS / UNIQUE_CODES).toFixed(1)}× reuse)`);
    console.log(`  elapsed         : ${(elapsedMs / 1000).toFixed(2)} s`);
    console.log(`  throughput      : ${rps} records/sec`);
    console.log(`  heap before     : ${toMB(memBefore.heapUsed)} MB`);
    console.log(`  heap peak       : ${toMB(peakHeap)} MB  (+${toMB(peakHeap - memBefore.heapUsed)} MB)`);
    console.log(`  heap after (gc) : ${toMB(memAfter.heapUsed)} MB`);
    console.log(`  rss  peak       : ${toMB(peakRss)} MB  (+${toMB(peakRss - memBefore.rss)} MB)`);

    await createdDbJob.reload();
    expect(createdDbJob.message).toContain(`Total: ${TOTAL_FOODS}`);
    expect(createdDbJob.message).toContain(`Updated: ${TOTAL_FOODS}`);

    return { elapsedMs, peakHeapDeltaMB: (peakHeap - memBefore.heapUsed) / 1024 / 1024 };
  };

  it('values-only: constant memory, no currentMappings growth', async () => {
    const { peakHeapDeltaMB } = await measureScenario(
      'values-only | 25,000 unique food codes',
      { surveyId: surveyId(), mode: 'values-only' },
    );
    expect(peakHeapDeltaMB).toBeLessThan(100);
  }, STRESS_TIMEOUT);

  it('values-and-codes: currentMappings grows O(unique food codes)', async () => {
    const { peakHeapDeltaMB } = await measureScenario(
      'values-and-codes | 25,000 unique food codes',
      { surveyId: surveyId(), mode: 'values-and-codes' },
    );
    expect(peakHeapDeltaMB).toBeLessThan(500);
  }, STRESS_TIMEOUT);

  it('values-and-codes + syncFields: full structural sync', async () => {
    const { peakHeapDeltaMB } = await measureScenario(
      'values-and-codes + syncFields | 25,000 unique food codes',
      { surveyId: surveyId(), mode: 'values-and-codes', syncFields: true },
    );
    expect(peakHeapDeltaMB).toBeLessThan(500);
  }, STRESS_TIMEOUT);
});
