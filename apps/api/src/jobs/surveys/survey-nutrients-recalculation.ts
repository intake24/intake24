import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import type { NutrientTableRecordField, NutrientTableRecordNutrient } from '@intake24/db';

import { NotFoundError } from '@intake24/api/http/errors';
import {
  Job as DbJob,
  Food as FoodModel,
  NutrientTableRecord,
  Op,
  SurveySubmissionFood,
  values,
} from '@intake24/db';

import BaseJob from '../job';

interface FoodMapping {
  code: string;
  englishName: string;
  localName: string | null;
  nutrientTableId: string;
  nutrientTableCode: string;
  fields: NutrientTableRecordField[];
  nutrients: NutrientTableRecordNutrient[];
  warning?: string;
}

interface ChangeSet {
  nutrientCodeChanged: boolean;
  fieldsAdded: string[];
  fieldsRemoved: string[];
  nutrientsAdded: string[];
  nutrientsRemoved: string[];
}

type UpdateRecord = {
  id: string;
  nutrientTableId?: string;
  nutrientTableCode?: string;
  fields: string;
  nutrients: string;
};

type ProcessFoodResult
  = { type: 'skipped'; error: boolean }
    | { type: 'cleared'; record: UpdateRecord }
    | { type: 'updated'; record: UpdateRecord; nutrientCodeUpdated: boolean; fieldsAdded: number; fieldsRemoved: number };

interface RecalculationFlags {
  shouldUpdateNutrientCodes: boolean;
  shouldSyncFields: boolean;
  shouldPruneFields: boolean;
  shouldSkipRecalculation: boolean;
}

interface RecalculationStats {
  totalProcessed: number;
  updated: number;
  skipped: number;
  nutrientCodesUpdated: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  clearedDueToMissingRecords: number;
  errors: number;
}

const BATCH_SIZE = 100;
export default class SurveyNutrientsRecalculation extends BaseJob<'SurveyNutrientsRecalculation'> {
  readonly name = 'SurveyNutrientsRecalculation';

  private dbJob!: DbJob;
  private readonly kyselyDb;
  private stats: RecalculationStats = {
    totalProcessed: 0,
    updated: 0,
    skipped: 0,
    nutrientCodesUpdated: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    clearedDueToMissingRecords: 0,
    errors: 0,
  };

  constructor({ kyselyDb, logger }: Pick<IoC, 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.kyselyDb = kyselyDb;
  }

  private resetStats() {
    this.stats = {
      totalProcessed: 0,
      updated: 0,
      skipped: 0,
      nutrientCodesUpdated: 0,
      fieldsAdded: 0,
      fieldsRemoved: 0,
      clearedDueToMissingRecords: 0,
      errors: 0,
    };
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

    this.logger.debug('Job started.', { params: this.params });

    this.resetStats();
    await this.recalculate();

    const summary = `Recalculation completed. Total: ${this.stats.totalProcessed}, Updated: ${this.stats.updated}, Skipped: ${this.stats.skipped}, Nutrient codes updated: ${this.stats.nutrientCodesUpdated}, Fields added: ${this.stats.fieldsAdded}, Fields removed: ${this.stats.fieldsRemoved}, Cleared due to missing records: ${this.stats.clearedDueToMissingRecords}, Errors: ${this.stats.errors}`;
    this.logger.info(summary);

    await this.dbJob.update({ message: summary });

    this.logger.debug('Job finished.');
  }

  /**
   * Resolve recalculation flags based on mode and syncFields option.
   *
   * syncFields controls structural changes to nutrients and fields:
   * - false: only update values of existing nutrients/fields; no add/remove, zero out unresolvable nutrients
   * - true:  full sync — add new, remove dropped, update all values
   */
  private getRecalculationFlags(): RecalculationFlags {
    const { mode = 'values-only', syncFields = false } = this.params;

    const shouldUpdateNutrientCodes = mode === 'values-and-codes';
    const shouldSyncFields = syncFields;
    const shouldPruneFields = shouldSyncFields; // Prune obsolete fields only when syncing (structural changes allowed)
    const shouldSkipRecalculation = mode === 'none';

    return {
      shouldUpdateNutrientCodes,
      shouldSyncFields,
      shouldPruneFields,
      shouldSkipRecalculation,
    };
  }

  /**
   * Fetch current food mappings from foods database
   */
  private async fetchCurrentFoodMappings(
    foodCodes: string[],
    locale: string,
  ): Promise<Map<string, FoodMapping | null>> {
    const foodRecords = await FoodModel.findAll({
      where: { code: foodCodes, localeId: locale },
      include: [
        {
          association: 'nutrientRecords',
          through: { attributes: [] },
          include: [{ association: 'fields' }, { association: 'nutrients' }],
        },
      ],
    });

    const mappingMap = new Map<string, FoodMapping | null>();

    // Add found foods
    for (const food of foodRecords) {
      if (!food.nutrientRecords || food.nutrientRecords.length === 0) {
        mappingMap.set(food.code, {
          code: food.code,
          englishName: food.englishName,
          localName: food.name,
          nutrientTableId: '0',
          nutrientTableCode: '0',
          fields: [],
          nutrients: [],
          warning: 'Food has no nutrient mappings',
        });
        continue;
      }

      // Use first nutrient record (consistent with submission behavior)
      const [nutrientRecord] = food.nutrientRecords;
      mappingMap.set(food.code, {
        code: food.code,
        englishName: food.englishName,
        localName: food.name,
        nutrientTableId: nutrientRecord.nutrientTableId,
        nutrientTableCode: nutrientRecord.nutrientTableRecordId,
        fields: nutrientRecord.fields ?? [],
        nutrients: nutrientRecord.nutrients ?? [],
      });
    }

    // Add null entries for missing foods
    for (const code of foodCodes) {
      if (!mappingMap.has(code)) {
        mappingMap.set(code, null);
      }
    }

    return mappingMap;
  }

  /**
   * Detect changes between stored and current food data
   */
  private detectChanges(
    stored: {
      nutrientTableId: string;
      nutrientTableCode: string;
      fields: Dictionary<string>;
      nutrients: Dictionary<number>;
    },
    current: FoodMapping | null,
  ): ChangeSet {
    const changeSet: ChangeSet = {
      nutrientCodeChanged: false,
      fieldsAdded: [],
      fieldsRemoved: [],
      nutrientsAdded: [],
      nutrientsRemoved: [],
    };

    if (!current)
      return changeSet;

    // Check nutrient table/record changes
    changeSet.nutrientCodeChanged = stored.nutrientTableId !== current.nutrientTableId
      || stored.nutrientTableCode !== current.nutrientTableCode;

    // Check field changes
    const storedFieldNames = new Set(Object.keys(stored.fields));
    const currentFieldNames = new Set(current.fields.map(f => f.name));

    for (const fieldName of currentFieldNames) {
      if (!storedFieldNames.has(fieldName)) {
        changeSet.fieldsAdded.push(fieldName);
      }
    }

    for (const fieldName of storedFieldNames) {
      if (!currentFieldNames.has(fieldName)) {
        changeSet.fieldsRemoved.push(fieldName);
      }
    }

    // Check nutrient changes
    const storedNutrientIds = new Set(Object.keys(stored.nutrients));
    const currentNutrientIds = new Set(current.nutrients.map(n => n.nutrientTypeId.toString()));

    for (const nutrientId of currentNutrientIds) {
      if (!storedNutrientIds.has(nutrientId)) {
        changeSet.nutrientsAdded.push(nutrientId);
      }
    }

    for (const nutrientId of storedNutrientIds) {
      if (!currentNutrientIds.has(nutrientId)) {
        changeSet.nutrientsRemoved.push(nutrientId);
      }
    }

    return changeSet;
  }

  /**
   * Build an UpdateRecord that clears nutrients and fields
   */
  private buildClearedRecord(
    foodId: string,
    nutrientTableId: string,
    nutrientTableCode: string,
    shouldUpdateNutrientCodes: boolean,
  ): UpdateRecord {
    const record: UpdateRecord = {
      id: foodId,
      fields: JSON.stringify({}),
      nutrients: JSON.stringify({}),
    };
    if (shouldUpdateNutrientCodes) {
      record.nutrientTableId = nutrientTableId;
      record.nutrientTableCode = nutrientTableCode;
    }
    return record;
  }

  /**
   * Process a single food item and return the result
   */
  private processFood(
    food: SurveySubmissionFood,
    currentMappings: Map<string, FoodMapping | null>,
    nutrientRecordMap: Record<string, { fields: NutrientTableRecordField[]; nutrients: NutrientTableRecordNutrient[] }>,
    portionWeight: number,
    flags: RecalculationFlags,
  ): ProcessFoodResult {
    // Skip if nutrient table is not defined (e.g. recipe builder template)
    if (!food.nutrientTableId || !food.nutrientTableCode) {
      return { type: 'skipped', error: false };
    }

    const currentMapping = currentMappings.get(`${food.locale}:${food.code}`);
    let nutrientTableId = food.nutrientTableId;
    let nutrientTableCode = food.nutrientTableCode;

    // Handle missing food in current database
    if (currentMapping === null && (flags.shouldUpdateNutrientCodes || flags.shouldSyncFields)) {
      this.logger.warn('Food not found in current database', {
        foodId: food.id,
        code: food.code,
        locale: food.locale,
      });
      return { type: 'skipped', error: true };
    }

    // Handle food with warning (e.g., no nutrient mappings) — clear nutrients and fields
    if (currentMapping?.warning) {
      this.logger.warn(`${currentMapping.warning} - clearing nutrients and fields`, {
        foodId: food.id,
        code: food.code,
      });
      return {
        type: 'cleared',
        record: this.buildClearedRecord(food.id, nutrientTableId, nutrientTableCode, flags.shouldUpdateNutrientCodes),
      };
    }

    // Resolve nutrient data source
    let nutrientData: { fields: NutrientTableRecordField[]; nutrients: NutrientTableRecordNutrient[] } | null = null;

    if (flags.shouldUpdateNutrientCodes && currentMapping) {
      nutrientTableId = currentMapping.nutrientTableId;
      nutrientTableCode = currentMapping.nutrientTableCode;
      nutrientData = {
        fields: currentMapping.fields,
        nutrients: currentMapping.nutrients,
      };
    }
    else {
      const key = `${food.nutrientTableId}:${food.nutrientTableCode}`;
      nutrientData = nutrientRecordMap[key] ?? null;
    }

    // Handle deleted nutrient record
    if (!nutrientData) {
      this.logger.warn('Nutrient record deleted or dissociated - clearing nutrients and fields', {
        foodId: food.id,
        code: food.code,
        nutrientTableId,
        nutrientTableCode,
      });
      return {
        type: 'cleared',
        record: this.buildClearedRecord(food.id, nutrientTableId, nutrientTableCode, flags.shouldUpdateNutrientCodes),
      };
    }

    // Detect changes
    const changeSet = (flags.shouldSyncFields || flags.shouldUpdateNutrientCodes) && currentMapping
      ? this.detectChanges(
          {
            nutrientTableId: food.nutrientTableId,
            nutrientTableCode: food.nutrientTableCode,
            fields: food.fields ?? {},
            nutrients: food.nutrients ?? {},
          },
          currentMapping,
        )
      : {
          nutrientCodeChanged: false,
          fieldsAdded: [],
          fieldsRemoved: [],
          nutrientsAdded: [],
          nutrientsRemoved: [],
        };

    // Build fields object
    let fieldsAdded = 0;
    let fieldsRemoved = 0;
    const fieldsObj: Dictionary = { ...(food.fields ?? {}) };

    if (flags.shouldSyncFields && currentMapping) {
      for (const field of nutrientData.fields) {
        if (fieldsObj[field.name] === undefined || changeSet.fieldsAdded.includes(field.name)) {
          fieldsObj[field.name] = field.value;
          if (changeSet.fieldsAdded.includes(field.name)) {
            fieldsAdded++;
          }
        }
        else {
          fieldsObj[field.name] = field.value;
        }
      }

      if (flags.shouldPruneFields) {
        const currentFieldNames = new Set(nutrientData.fields.map(f => f.name));
        for (const fieldName of Object.keys(fieldsObj)) {
          if (!currentFieldNames.has(fieldName)) {
            delete fieldsObj[fieldName];
            fieldsRemoved++;
          }
        }
      }
    }
    else {
      const nutrientFieldMap = new Map(nutrientData.fields.map(f => [f.name, f.value]));
      for (const fieldName of Object.keys(fieldsObj)) {
        const newValue = nutrientFieldMap.get(fieldName);
        if (newValue !== undefined) {
          fieldsObj[fieldName] = newValue;
        }
      }
    }

    // Calculate nutrients
    let nutrientsObj: Dictionary;

    if (flags.shouldSyncFields) {
      nutrientsObj = nutrientData.nutrients.reduce<Dictionary>((acc, { nutrientTypeId, unitsPer100g }) => {
        acc[nutrientTypeId.toString()] = (unitsPer100g * portionWeight) / 100.0;
        return acc;
      }, {});
    }
    else {
      const sourceNutrientMap = new Map(
        nutrientData.nutrients.map(n => [n.nutrientTypeId.toString(), n.unitsPer100g]),
      );
      nutrientsObj = { ...(food.nutrients ?? {}) };
      for (const nutrientId of Object.keys(nutrientsObj)) {
        const unitsPer100g = sourceNutrientMap.get(nutrientId);
        if (unitsPer100g !== undefined) {
          nutrientsObj[nutrientId] = (unitsPer100g * portionWeight) / 100.0;
        }
        else {
          nutrientsObj[nutrientId] = 0;
        }
      }
    }

    // Build update record
    const record: UpdateRecord = {
      id: food.id,
      fields: JSON.stringify(fieldsObj),
      nutrients: JSON.stringify(nutrientsObj),
    };

    let nutrientCodeUpdated = false;
    if (flags.shouldUpdateNutrientCodes) {
      record.nutrientTableId = nutrientTableId;
      record.nutrientTableCode = nutrientTableCode;
      nutrientCodeUpdated = changeSet.nutrientCodeChanged;
    }

    return { type: 'updated', record, nutrientCodeUpdated, fieldsAdded, fieldsRemoved };
  }

  private async recalculate(batchSize = BATCH_SIZE) {
    const { surveyId } = this.params;
    const flags = this.getRecalculationFlags();

    if (flags.shouldSkipRecalculation) {
      this.logger.info('Recalculation mode is "none", skipping.');
      return;
    }

    const total = await SurveySubmissionFood.count({
      include: [{
        association: 'meal',
        required: true,
        include: [{ association: 'submission', where: { surveyId }, required: true }],
      }],
    });

    if (total === 0) {
      this.logger.info('No foods found for survey, completing successfully.');
      return;
    }

    this.initProgress(total);

    const offsets = Array.from({ length: Math.ceil(total / batchSize) }, (_, i) => i * batchSize);

    for (const offset of offsets) {
      const limit = Math.min(batchSize, total - offset);

      // Fetch foods with additional attributes needed for code updates
      const foods = await SurveySubmissionFood.findAll({
        attributes: [
          'id',
          'code',
          'englishName',
          'localName',
          'locale',
          'nutrientTableId',
          'nutrientTableCode',
          'fields',
          'nutrients',
          'portionSize',
        ],
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

      // Group by locale for efficient food lookup
      const localeGroups = Map.groupBy(foods, ({ locale }) => locale);

      // Fetch current food mappings if needed
      const currentMappings = new Map<string, FoodMapping | null>();
      if (flags.shouldUpdateNutrientCodes || flags.shouldSyncFields) {
        for (const [locale, localeFoods] of localeGroups) {
          const foodCodes = [...new Set(localeFoods.map(f => f.code))];
          const localeMappings = await this.fetchCurrentFoodMappings(foodCodes, locale);
          localeMappings.forEach((mapping, code) => currentMappings.set(`${locale}:${code}`, mapping));
        }
      }

      // Prepare nutrient table lookups (for legacy approach or when not updating codes)
      const nutrientTableRecordIds: Record<string, Set<string>> = {};
      const portionWeights = new Map<string, number>();

      for (const food of foods) {
        // Calculate portion weight
        const portionWeight = Math.abs(
          Number(food.portionSize?.servingWeight ?? '0') - Number(food.portionSize?.leftoversWeight ?? '0'),
        );
        portionWeights.set(food.id, portionWeight);

        // Determine which nutrient table/code to use
        let nutrientTableId = food.nutrientTableId;
        let nutrientTableCode = food.nutrientTableCode;

        // Values-only: keep stored mapping. Values-and-codes: swap to current mapping when available.
        if (flags.shouldUpdateNutrientCodes) {
          const currentMapping = currentMappings.get(`${food.locale}:${food.code}`);
          if (currentMapping && !currentMapping.warning) {
            nutrientTableId = currentMapping.nutrientTableId;
            nutrientTableCode = currentMapping.nutrientTableCode;
          }
        }

        if (!nutrientTableRecordIds[nutrientTableId]) {
          nutrientTableRecordIds[nutrientTableId] = new Set();
        }
        nutrientTableRecordIds[nutrientTableId].add(nutrientTableCode);
      }

      // Fetch nutrient records
      const conditions = Object.entries(nutrientTableRecordIds).map(
        ([nutrientTableId, codes]) => ({ nutrientTableId, nutrientTableRecordId: [...codes] }),
      );

      const nutrientRecords = conditions.length > 0
        ? await NutrientTableRecord.findAll({
            attributes: ['nutrientTableId', 'nutrientTableRecordId'],
            include: [{ association: 'fields' }, { association: 'nutrients' }],
            where: conditions.length > 1 ? { [Op.or]: conditions } : conditions[0],
          })
        : [];

      const nutrientRecordMap = nutrientRecords.reduce<
        Record<string, { fields: NutrientTableRecordField[]; nutrients: NutrientTableRecordNutrient[] }>
      >((acc, item) => {
        acc[`${item.nutrientTableId}:${item.nutrientTableRecordId}`] = {
          fields: item.fields ?? [],
          nutrients: item.nutrients ?? [],
        };
        return acc;
      }, {});

      // Build update records
      const records: UpdateRecord[] = [];
      let batchNutrientCodesUpdated = 0;
      let batchFieldsAdded = 0;
      let batchFieldsRemoved = 0;
      let batchSkipped = 0;

      for (const food of foods) {
        this.stats.totalProcessed++;
        const portionWeight = portionWeights.get(food.id) ?? 0;
        const result = this.processFood(food, currentMappings, nutrientRecordMap, portionWeight, flags);

        switch (result.type) {
          case 'skipped':
            batchSkipped++;
            if (result.error)
              this.stats.errors++;
            break;
          case 'cleared':
            records.push(result.record);
            this.stats.clearedDueToMissingRecords++;
            break;
          case 'updated':
            records.push(result.record);
            if (result.nutrientCodeUpdated)
              batchNutrientCodesUpdated++;
            batchFieldsAdded += result.fieldsAdded;
            batchFieldsRemoved += result.fieldsRemoved;
            break;
        }
      }

      // Update database
      if (records.length > 0) {
        const baseQuery = this.kyselyDb.system
          .updateTable('surveySubmissionFoods')
          .from(values(records, 'data'))
          .whereRef('surveySubmissionFoods.id', '=', ({ cast, ref }) => cast(ref('data.id'), 'uuid'));

        if (flags.shouldUpdateNutrientCodes) {
          await baseQuery
            .set({
              fields: ({ cast, ref }) => cast(ref('data.fields'), 'jsonb'),
              nutrients: ({ cast, ref }) => cast(ref('data.nutrients'), 'jsonb'),
              nutrientTableId: ({ ref }) => ref('data.nutrientTableId'),
              nutrientTableCode: ({ ref }) => ref('data.nutrientTableCode'),
            })
            .executeTakeFirst();
        }
        else {
          await baseQuery
            .set({
              fields: ({ cast, ref }) => cast(ref('data.fields'), 'jsonb'),
              nutrients: ({ cast, ref }) => cast(ref('data.nutrients'), 'jsonb'),
            })
            .executeTakeFirst();
        }
      }

      // Update batch statistics
      this.stats.updated += records.length;
      this.stats.skipped += batchSkipped;
      this.stats.nutrientCodesUpdated += batchNutrientCodesUpdated;
      this.stats.fieldsAdded += batchFieldsAdded;
      this.stats.fieldsRemoved += batchFieldsRemoved;

      this.logger.debug('Batch processed', {
        offset,
        limit,
        processed: foods.length,
        updated: records.length,
        skipped: batchSkipped,
        nutrientCodesUpdated: batchNutrientCodesUpdated,
      });

      await this.incrementProgress(limit);
    }
  }
}
