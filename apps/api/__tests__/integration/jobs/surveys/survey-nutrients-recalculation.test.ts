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
  type RecalculationMode = 'none' | 'values-only' | 'values-and-codes';
  type RecalculationJobParams = { surveyId: string; mode: RecalculationMode; syncFields?: boolean };

  const createMockBullJob = (dbJobId: string, params: RecalculationJobParams): BullJob => {
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
    foodEnglishName: string;
    foodLocalName: string;
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
      englishName: options.foodEnglishName,
      localName: options.foodLocalName,
      locale: options.localeId,
      readyMeal: false,
      searchTerm: 'food',
      portionSizeMethodId: 'standard-portion',
      reasonableAmount: true,
      brand: null,
      nutrientTableId: options.nutrientTableId,
      nutrientTableCode: options.nutrientTableCode,
      barcode: null,
      fields: { sub_group_code: '62R' },
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

    const runRecalculationJob = async (params: RecalculationJobParams) => {
      const createdDbJob = await DbJob.create({
        type: 'SurveyNutrientsRecalculation',
        userId: userId(),
        params,
      });
      dbJob = createdDbJob;

      const job = ioc.resolve('SurveyNutrientsRecalculation');
      const mockBullJob = createMockBullJob(createdDbJob.id, params);

      await job.run(mockBullJob);

      return { mockBullJob, dbJob: createdDbJob };
    };

    const expectFoodIdentityUnchanged = (refreshed: SurveySubmissionFood | null, foodCode: string) => {
      expect(refreshed?.code).toBe(foodCode);
      expect(refreshed?.englishName).toBe('Test Food English');
      expect(refreshed?.localName).toBe('Test Food');
    };

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
        name: 'sub_group_code',
        value: '62R',
      });

      recordBField = await NutrientTableRecordField.create({
        nutrientTableRecordId: recordB.id,
        name: 'sub_group_code',
        value: '37L',
      });

      const foodCode = 'PMSW';
      const foodEnglishName = 'Test Food English';
      const foodLocalName = 'Test Food';

      food = await Food.create({
        code: foodCode,
        localeId,
        name: foodEnglishName,
        englishName: foodEnglishName,
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
        foodEnglishName,
        foodLocalName,
        nutrientTableId,
        nutrientTableCode: recordA.nutrientTableRecordId,
      });

      submission = submissionData.submission;
      submissionMeal = submissionData.meal;
      submissionFood = submissionData.food;

      return { nutrientTableId, foodCode };
    };

    /**
     * Test case: `none` mode does not make any changes to submission data.
     * The job completes without modifying any nutrients, fields, or nutrient table references.
     * This is a safety/dry-run mode for testing job configuration.
     */
    it('none mode does not change submission data', async () => {
      const { foodCode } = await setupFoodAndNutrients();

      // Capture initial state
      const initial = await SurveySubmissionFood.findByPk(submissionFood!.id);
      const initialNutrients = { ...initial!.nutrients };
      const initialFields = { ...initial!.fields };
      const initialCode = initial!.nutrientTableCode;
      const initialTableId = initial!.nutrientTableId;

      // Switch mapping to record B to simulate a change that would normally trigger recalculation
      await foodNutrient!.destroy();
      await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });

      // Run job in `none` mode (dry-run)
      await runRecalculationJob({ surveyId: surveyId(), mode: 'none' });

      // Verify nothing changed
      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(initialTableId);
      expect(refreshed?.nutrientTableCode).toBe(initialCode);
      expect(refreshed?.nutrients).toEqual(initialNutrients);
      expect(refreshed?.fields).toEqual(initialFields);
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    it('completes with summary when there are no submission records', async () => {
      const { mockBullJob, dbJob: createdDbJob } = await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      await createdDbJob.reload();

      expect(createdDbJob.message).toContain('Total: 0');
      expect(createdDbJob.message).toContain('Updated: 0');
      expect(createdDbJob.message).toContain('Skipped: 0');
      expect(mockBullJob.updateProgress).not.toHaveBeenCalled();
    });

    it('completes with summary when submissions have no foods', async () => {
      const submission = await SurveySubmission.create(mocker.system.submission(surveyId(), userId())) as SurveySubmission;
      const meal = await SurveySubmissionMeal.create({
        id: randomUUID(),
        surveySubmissionId: submission.id,
        hours: 12,
        minutes: 30,
        name: 'Lunch',
        duration: null,
        customData: {},
      });

      try {
        const { mockBullJob, dbJob: createdDbJob } = await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

        await createdDbJob.reload();

        expect(createdDbJob.message).toContain('Total: 0');
        expect(createdDbJob.message).toContain('Updated: 0');
        expect(createdDbJob.message).toContain('Skipped: 0');
        expect(mockBullJob.updateProgress).not.toHaveBeenCalled();
      }
      finally {
        await cleanupRecords([meal, submission]);
      }
    });

    it('values-only keeps stored nutrient codes', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B after submission
      await foodNutrient!.update({ nutrientTableRecordId: recordB!.id });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50 });
      expect(refreshed?.fields).toEqual({ sub_group_code: '62R' });
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    it('values-only w/o syncFields updates nutrient values when underlying record changes', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Update underlying record values (A) - change 50 -> 75
      await recordANutrient!.update({ unitsPer100g: 75 });
      // Update underlying field value - change '62R' -> '62R_v2'
      await recordAField!.update({ value: '62R_v2' });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      // Keeps reference to A, but updates values from A
      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 75 });
      expect(refreshed?.fields).toEqual({ sub_group_code: '62R_v2' });
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only (syncFields=false) zeroes out unresolvable nutrients.
     * When a nutrient variable is dropped from the underlying record, syncFields=false
     * preserves the nutrient key in the submission but sets its value to 0.
     * The nutrient is NOT removed — structural changes require syncFields=true.
     */
    it('values-only w/o syncFields zeroes out nutrients when underlying record no longer contains them', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add a second nutrient to record A (using nutrient type 2)
      const recordANutrient2 = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordA!.id,
        nutrientTypeId: '2',
        unitsPer100g: 150,
      });

      // Update submission to include both nutrients
      await submissionFood!.update({
        nutrients: { 1: 50, 2: 150 },
      });

      // Verify initial state has both nutrients
      const current = await SurveySubmissionFood.findByPk(submissionFood!.id);
      expect(current?.nutrients).toEqual({ 1: 50, 2: 150 });

      // Simulate dropping nutrient type 2 from the nutrient table
      await recordANutrient2.destroy();

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50, 2: 0 }); // Nutrient type 1 recalculated; type 2 zeroed out (unresolvable), NOT removed
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only (syncFields=false) does clear nutrients and fields when nutrient record is deleted.
     * When the underlying nutrient record is deleted, syncFields=false should clear all nutrients and fields from the submission
     * since they are unresolvable without the record — even if the nutrient/field keys remain in the submission.
     */
    it('values-only w/o syncFields does clear nutrients and fields when nutrient record is deleted', async () => {
      const { foodCode } = await setupFoodAndNutrients();

      // Verify initial state
      const submission = await SurveySubmissionFood.findByPk(submissionFood!.id);
      expect(submission?.nutrients).toEqual({ 1: 100 });
      expect(submission?.fields).toEqual({ sub_group_code: '62R' });

      // Delete the nutrient record (simulate dropped variable)
      await recordA!.destroy();

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      // Verify nutrients and fields are cleared
      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);
      expect(refreshed?.nutrients).toEqual({});
      expect(refreshed?.fields).toEqual({});
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only (syncFields=false) does NOT add new nutrients.
     * When a new nutrient variable is added to the underlying record, syncFields=false
     * does not add it to the submission — only existing nutrients are recalculated.
     * Adding new nutrients requires syncFields=true.
     */
    it('values-only w/o syncFields does not add new nutrients to submission', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add a second nutrient to record A (submission only has nutrient type 1)
      await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordA!.id,
        nutrientTypeId: '2',
        unitsPer100g: 150,
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50 }); // Only existing nutrient type 1 is recalculated; type 2 NOT added
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only with syncFields
     * Verifies that syncFields does not override the values-only mapping choice,
     * but still recalculates nutrient/field values from the stored record.
     */
    it('values-only + syncFields updates nutrient values similar to standard values-only', async () => {
      // Seed base nutrient table, record A, and submission food tied to record A.
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      await recordANutrient!.update({ unitsPer100g: 90 }); // Update underlying record values (A) - change 50 -> 90
      await recordAField!.update({ value: '62R_v2' }); // Update underlying field value - change '62R' -> '62R_v2'

      // Even if food mapping points to B (simulate change), values-only keeps it on A
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only', syncFields: true });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      // Keeps reference to A (values-only preference)
      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 90 });// Updates values based on A's new state (90)
      expect(refreshed?.fields).toEqual({ sub_group_code: '62R_v2' });
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only + syncFields=true adds new nutrients.
     * When a new nutrient variable is added to the underlying record and syncFields=true,
     * the new nutrient should appear in the submission after recalculation.
     */
    it('values-only + syncFields adds new nutrients when underlying nutrient table record adds them', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add a second nutrient to record A (submission only has type 1)
      await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordA!.id,
        nutrientTypeId: '2',
        unitsPer100g: 150,
      });

      // Verify initial state submission has only 1 nutrient (type 1)
      const current = await SurveySubmissionFood.findByPk(submissionFood!.id);
      expect(current?.nutrients).toEqual({ 1: 100 });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only', syncFields: true });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50, 2: 150 }); // syncFields=true: both nutrients present (type 2 added)
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-only + syncFields=true removes dropped nutrients.
     * When a nutrient variable is removed from the underlying record and syncFields=true,
     * it should be fully removed from the submission (not just zeroed out).
     */
    it('values-only + syncFields removes dropped nutrients from submission', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add a second nutrient to record A
      const recordANutrient2 = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordA!.id,
        nutrientTypeId: '2',
        unitsPer100g: 150,
      });

      // Update submission to include both nutrients
      await submissionFood!.update({
        nutrients: { 1: 50, 2: 150 },
      });

      // Drop nutrient type 2 from record A
      await recordANutrient2.destroy();

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only', syncFields: true });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('A');
      expect(refreshed?.nutrients).toEqual({ 1: 50 }); // syncFields=true: nutrient type 2 fully removed (not zeroed)
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    it('values-and-codes w/o syncFields updates nutrient codes to current food-nutrient mapping', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B after submission - destroy and recreate since update doesn't work on composite PKs
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });
      expect(foodNutrient.nutrientTableRecordId === recordB!.id, 'FoodNutrient mapping should be to record B');

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 1: 200 });
      expect(refreshed?.fields).toEqual({ sub_group_code: '37L' });
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    /**
     * Test case: values-and-codes (syncFields=false) does NOT add new nutrients.
     * When food is remapped to a record with additional nutrients, syncFields=false
     * only recalculates existing nutrients — new ones are NOT added.
     */
    it('values-and-codes w/o syncFields does not add nutrients from new mapping', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add a second nutrient to record B that the submission doesn't have
      const recordBNutrient2 = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordB!.id,
        nutrientTypeId: '2',
        unitsPer100g: 300,
      });

      // Switch mapping to record B
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 1: 200 }); // Nutrient 1 recalculated from B (200); nutrient 2 NOT added (syncFields=false)
      expect(refreshed?.fields).toEqual({ sub_group_code: '37L' }); // existing field value updated from B
      expectFoodIdentityUnchanged(refreshed, foodCode);

      // Cleanup extra nutrient
      await recordBNutrient2.destroy();
    });

    /**
     * Test case: values-and-codes (syncFields=false) zeroes unresolvable nutrients.
     * When food is remapped to a record that doesn't have a nutrient the submission has,
     * that nutrient is zeroed out (preserved but set to 0).
     */
    it('values-and-codes w/o syncFields zeroes out unresolvable nutrients', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Add nutrient type 2 to submission (but record B doesn't have it)
      await submissionFood!.update({
        nutrients: { 1: 50, 2: 150 },
      });

      // Switch mapping to record B (only has nutrient type 1)
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes' });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 1: 200, 2: 0 }); // Nutrient 1 recalculated from B; nutrient 2 zeroed out (not in B)
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });

    it('values-and-codes w/o syncFields does clear nutrients and fields when food-nutrient mapping is removed', async () => {
      const { foodCode } = await setupFoodAndNutrients();

      // Remove the nutrient mapping (food still exists, but no nutrient association)
      await foodNutrient!.destroy();

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes' });

      // Verify nutrients and fields are cleared
      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);
      expect(refreshed?.nutrients).toEqual({});
      expect(refreshed?.fields).toEqual({});
      expectFoodIdentityUnchanged(refreshed, foodCode);
    });
    it('values-and-codes + syncFields recalculates nutrients, mappings and add nutrient types to submission', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B and change food names in foods DB - destroy and recreate
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });
      // Add a second nutrient to record B that the submission doesn't have
      const recordBNutrient2 = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordB!.id,
        nutrientTypeId: '2',
        unitsPer100g: 300,
      });

      await food!.update({
        name: 'Renamed Food',
        englishName: 'Renamed Food',
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes', syncFields: true });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 1: 200, 2: 300 }); // syncFields=true: both nutrients present (type 2 added)
      expect(refreshed?.fields).toEqual({ sub_group_code: '37L' });
      expectFoodIdentityUnchanged(refreshed, foodCode);

      // Cleanup extra nutrient
      await recordBNutrient2.destroy();
    });

    it('values-and-codes + syncFields recalculates nutrients, mappings and remove nutrient types from submission', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      // Switch mapping to record B and change food names in foods DB - destroy and recreate
      await foodNutrient!.destroy();
      foodNutrient = await FoodNutrient.create({
        foodId: food!.id,
        nutrientTableRecordId: recordB!.id,
      });
      // Remove nutrient type 1 from record B
      await recordBNutrient!.destroy();

      // Add a second nutrient (type 2) to record B that the submission doesn't have
      const recordBNutrient2 = await NutrientTableRecordNutrient.create({
        nutrientTableRecordId: recordB!.id,
        nutrientTypeId: '2',
        unitsPer100g: 300,
      });

      await food!.update({
        name: 'Renamed Food',
        englishName: 'Renamed Food',
      });

      await runRecalculationJob({ surveyId: surveyId(), mode: 'values-and-codes', syncFields: true });

      const refreshed = await SurveySubmissionFood.findByPk(submissionFood!.id);

      expect(refreshed?.nutrientTableId).toBe(nutrientTableId);
      expect(refreshed?.nutrientTableCode).toBe('B');
      expect(refreshed?.nutrients).toEqual({ 2: 300 }); // syncFields=true: nutrient type 1 removed (not in B); nutrient 2 added
      expect(refreshed?.fields).toEqual({ sub_group_code: '37L' });
      expectFoodIdentityUnchanged(refreshed, foodCode);

      // Cleanup extra nutrient
      await recordBNutrient2.destroy();
    });

    it('recalculates in batches when there are more than 100 submission foods', async () => {
      const { nutrientTableId, foodCode } = await setupFoodAndNutrients();

      const totalFoods = 120;
      const extraFoods = totalFoods - 1;
      const extraRecords: Array<{ destroy: () => Promise<unknown> }> = [];

      try {
        for (let i = 0; i < extraFoods; i++) {
          const extra = await createSubmissionData({
            surveyId: surveyId(),
            userId: userId(),
            localeId,
            foodCode,
            foodEnglishName: 'Test Food English',
            foodLocalName: 'Test Food',
            nutrientTableId,
            nutrientTableCode: recordA!.nutrientTableRecordId,
          });

          extraRecords.push(extra.food, extra.meal, extra.submission);
        }

        const { mockBullJob, dbJob: createdDbJob } = await runRecalculationJob({ surveyId: surveyId(), mode: 'values-only' });

        await createdDbJob.reload();

        expect(createdDbJob.message).toContain(`Total: ${totalFoods}`);
        expect(createdDbJob.message).toContain(`Updated: ${totalFoods}`);
        expect(mockBullJob.updateProgress).toHaveBeenCalledTimes(2);
        const progressSpy = mockBullJob.updateProgress as ReturnType<typeof vi.fn>;
        expect(progressSpy.mock.calls[0][0]).toBeCloseTo(100 / totalFoods, 4);
        expect(progressSpy.mock.calls[1][0]).toBeCloseTo(1, 4);
      }
      finally {
        await cleanupRecords(extraRecords);
      }
    });
  });
};
