import { randomUUID } from 'node:crypto';

import { Job as BullJob } from 'bullmq';
import { vi } from 'vitest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
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

export default () => {
  const createMockBullJob = (dbJobId: string, params: { surveyId: string; mode: string; syncFields?: boolean }): BullJob => {
    return {
      id: `db-${dbJobId}`,
      data: { params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;
  };

  const createSubmissionData = async (options: {
    surveyId: string;
    userId: string;
    localeId: string;
    foodCode: string;
    foodName: string;
    nutrientTableId: string;
    nutrientTableCode: string;
  }): Promise<{
    submission: SurveySubmission;
    meal: SurveySubmissionMeal;
    food: SurveySubmissionFood;
  }> => {
    const submission = mocker.system.submission(options.surveyId, options.userId);
    const createdSubmission = await SurveySubmission.create(submission) as SurveySubmission;

    const meal = await SurveySubmissionMeal.create({
      id: randomUUID(),
      surveySubmissionId: submission.id,
      hours: 8,
      minutes: 0,
      name: 'Breakfast',
      duration: null,
      customData: {},
    });

    const food = await SurveySubmissionFood.create({
      id: randomUUID(),
      mealId: meal.id,
      index: 0,
      code: options.foodCode,
      englishName: options.foodName,
      localName: options.foodName,
      locale: options.localeId,
      readyMeal: false,
      searchTerm: 'food',
      portionSizeMethodId: 'standard-portion',
      reasonableAmount: true,
      brand: null,
      nutrientTableId: options.nutrientTableId,
      nutrientTableCode: options.nutrientTableCode,
      barcode: null,
      fields: { group: 'A' },
      nutrients: { 1: 100 },
      portionSize: {
        method: 'standard-portion',
        servingWeight: 100,
        leftoversWeight: 0,
        unit: null,
        quantity: 1,
        linkedQuantity: 1,
      },
      customData: {},
    });

    return { submission: createdSubmission, meal, food };
  };

  const cleanupRecords = async (records: Array<{ destroy: () => Promise<unknown> } | null>) => {
    for (const record of records) {
      if (record)
        await record.destroy();
    }
  };

  describe('recalculation modes', () => {
    let nutrientTable: NutrientTable | null = null;
    let recordA: NutrientTableRecord | null = null;
    let recordB: NutrientTableRecord | null = null;
    let recordANutrient: NutrientTableRecordNutrient | null = null;
    let recordBNutrient: NutrientTableRecordNutrient | null = null;
    let recordAField: NutrientTableRecordField | null = null;
    let recordBField: NutrientTableRecordField | null = null;
    let food: Food | null = null;
    let foodNutrient: FoodNutrient | null = null;
    let submissionFood: SurveySubmissionFood | null = null;
    let submissionMeal: SurveySubmissionMeal | null = null;
    let submission: SurveySubmission | null = null;
    let dbJob: DbJob | null = null;

    const localeId = 'en_GB';
    const userId = () => suite.data.system.user.id;
    const surveyId = () => suite.data.system.Survey.id;

    afterEach(async () => {
      await cleanupRecords([
        submissionFood,
        submissionMeal,
        submission,
        foodNutrient,
        recordAField,
        recordBField,
        recordANutrient,
        recordBNutrient,
        recordA,
        recordB,
        nutrientTable,
        food,
        dbJob,
      ]);

      submissionFood = null;
      submissionMeal = null;
      submission = null;
      foodNutrient = null;
      recordAField = null;
      recordBField = null;
      recordANutrient = null;
      recordBNutrient = null;
      recordA = null;
      recordB = null;
      nutrientTable = null;
      food = null;
      dbJob = null;
    });

    const setupFoodAndNutrients = async () => {
      const nutrientTableId = `NT${Date.now()}`;
      nutrientTable = await NutrientTable.create({
        id: nutrientTableId,
        description: 'Test nutrient table',
      });

      recordA = await NutrientTableRecord.create({
        nutrientTableId,
        nutrientTableRecordId: 'A',
        name: 'Record A',
        localName: 'Record A',
      });

      recordB = await NutrientTableRecord.create({
        nutrientTableId,
        nutrientTableRecordId: 'B',
        name: 'Record B',
        localName: 'Record B',
      });

      recordANutrient = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordA.id,
        nutrientTypeId: '1',
        unitsPer100g: 50,
      });

      recordBNutrient = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordB.id,
        nutrientTypeId: '1',
        unitsPer100g: 200,
      });

      recordAField = await NutrientTableRecordField.create({
        nutrientTableRecordId: recordA.id,
        name: 'group',
        value: 'A',
      });

      recordBField = await NutrientTableRecordField.create({
        nutrientTableRecordId: recordB.id,
        name: 'group',
        value: 'B',
      });

      const foodCode = `FOOD_${Date.now()}`;
      const foodName = 'Test Food';

      food = await Food.create({
        code: foodCode,
        localeId,
        name: foodName,
        englishName: foodName,
        version: randomUUID(),
        tags: [],
      });

      foodNutrient = await FoodNutrient.create({
        foodId: food.id,
        nutrientTableRecordId: recordA.id,
      });

      const submissionData = await createSubmissionData({
        surveyId: surveyId(),
        userId: userId(),
        localeId,
        foodCode,
        foodName,
        nutrientTableId,
        nutrientTableCode: recordA.nutrientTableRecordId,
      });

      submission = submissionData.submission;
      submissionMeal = submissionData.meal;
      submissionFood = submissionData.food;

      return { nutrientTableId, foodCode };
    };

    it('values-only keeps stored nutrient codes', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B after submission
      await foodNutrient!.update({ nutrientTableRecordId: recordB!.id });

      dbJob = await DbJob.create({
        type: 'SurveyNutrientsRecalculation',
        userId: userId(),
        params: { surveyId: surveyId(), mode: 'values-only' },
      });

      const job = ioc.resolve('SurveyNutrientsRecalculation');
      const mockBullJob = createMockBullJob(dbJob.id, { surveyId: surveyId(), mode: 'values-only' });

      await job.run(mockBullJob);

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50 });
      expect(refreshed?.fields).toEqual({ group: 'A' });
      expect(refreshed?.code).toBe(foodCode);
    });

    it('values-and-codes updates nutrient codes to current mapping', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B after submission
      await foodNutrient!.update({ nutrientTableRecordId: recordB!.id });

      dbJob = await DbJob.create({
        type: 'SurveyNutrientsRecalculation',
        userId: userId(),
        params: { surveyId: surveyId(), mode: 'values-and-codes' },
      });

      const job = ioc.resolve('SurveyNutrientsRecalculation');
      const mockBullJob = createMockBullJob(dbJob.id, { surveyId: surveyId(), mode: 'values-and-codes' });

      await job.run(mockBullJob);

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 1: 200 });
      expect(refreshed?.fields).toEqual({ group: 'B' });
      expect(refreshed?.code).toBe(foodCode);
    });
  });
};
