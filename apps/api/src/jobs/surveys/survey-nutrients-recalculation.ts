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
   * - false: only update values of existing nutrients/fields; no add/remove
   * - true:  full sync — add new, remove dropped, update all values
   */
  private getRecalculationFlags() {
    const { mode = 'values-only', syncFields = false } = this.params;

    const shouldUpdateNutrientCodes = mode === 'values-and-codes';
    const shouldSyncFields = syncFields;
    // Prune obsolete fields only when syncing (structural changes allowed)
    const shouldPruneFields = shouldSyncFields;
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
      code: string;
      englishName: string;
      localName: string | null;
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

  private async recalculate(batchSize = 100) {
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

    const offsets = [];
    let start = 0;

    while (start < total) {
      offsets.push(start);
      start += batchSize;
    }

    for (const offset of offsets) {
      const difference = batchSize + offset - total;
      const limit = difference > 0 ? batchSize - difference : batchSize;

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
      const localeGroups = new Map<string, typeof foods>();
      for (const food of foods) {
        const group = localeGroups.get(food.locale) ?? [];
        group.push(food);
        localeGroups.set(food.locale, group);
      }

      // Fetch current food mappings if needed
      const currentMappings = new Map<string, FoodMapping | null>();
      if (flags.shouldUpdateNutrientCodes || flags.shouldSyncFields) {
        for (const [locale, localeFoods] of localeGroups) {
          const foodCodes = [...new Set(localeFoods.map(f => f.code))];
          const localeMappings = await this.fetchCurrentFoodMappings(foodCodes, locale);
          for (const [code, mapping] of localeMappings) {
            currentMappings.set(`${locale}:${code}`, mapping);
          }
        }
      }

      // Prepare nutrient table lookups (for legacy approach or when not updating codes)
      const nutrientTableRecordIds: Record<string, string[]> = {};
      const portionWeights = new Map<string, number>();

      for (const food of foods) {
        // Calculate portion weight
        const portionWeight = Math.abs(
          Number(food.portionSize.servingWeight ?? '0') - Number(food.portionSize.leftoversWeight ?? '0'),
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
          nutrientTableRecordIds[nutrientTableId] = [];
        }
        nutrientTableRecordIds[nutrientTableId].push(nutrientTableCode);
      }

      // Fetch nutrient records
      const conditions = Object.entries(nutrientTableRecordIds).map(
        ([nutrientTableId, nutrientTableRecordId]) => ({ nutrientTableId, nutrientTableRecordId }),
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
      type UpdateRecord = {
        id: string;
        nutrientTableId?: string;
        nutrientTableCode?: string;
        fields: string;
        nutrients: string;
      };

      const records: UpdateRecord[] = [];
      let batchNutrientCodesUpdated = 0;
      let batchFieldsAdded = 0;
      let batchFieldsRemoved = 0;
      let batchSkipped = 0;

      for (const food of foods) {
        this.stats.totalProcessed++;

        // Skip if nutrient table is not defined (e.g. recipe builder template)
        if (!food.nutrientTableId || !food.nutrientTableCode) {
          batchSkipped++;
          continue;
        }

        const currentMapping = currentMappings.get(`${food.locale}:${food.code}`);

        // Get nutrient data (either from current mapping or stored reference)
        let nutrientTableId = food.nutrientTableId;
        let nutrientTableCode = food.nutrientTableCode;
        // Handle missing food in current database
        if (currentMapping === null) {
          this.logger.warn('Food not found in current database', {
            foodId: food.id,
            code: food.code,
            locale: food.locale,
          });
          batchSkipped++;
          this.stats.errors++;
          continue;
        }

        // Handle food with warning (e.g., no nutrient mappings) - clear nutrients and fields
        if (currentMapping?.warning) {
          this.logger.warn(`${currentMapping.warning} - clearing nutrients and fields`, {
            foodId: food.id,
            code: food.code,
          });

          // Clear nutrients and fields for this submission food
          const record: UpdateRecord = {
            id: food.id,
            fields: JSON.stringify({}),
            nutrients: JSON.stringify({}),
          };

          // Include nutrient table references to maintain consistent record structure
          if (flags.shouldUpdateNutrientCodes) {
            record.nutrientTableId = nutrientTableId;
            record.nutrientTableCode = nutrientTableCode;
          }

          records.push(record);
          this.stats.clearedDueToMissingRecords++;
          continue;
        }

        let nutrientData: { fields: NutrientTableRecordField[]; nutrients: NutrientTableRecordNutrient[] } | null = null;

        // Values-and-codes uses current nutrient mappings; values-only uses stored nutrient table IDs.
        if (flags.shouldUpdateNutrientCodes && currentMapping && !currentMapping.warning) {
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

        // Handle deleted nutrient record: clear nutrients and fields
        if (!nutrientData) {
          this.logger.warn('Nutrient record deleted or dissociated - clearing nutrients and fields', {
            foodId: food.id,
            code: food.code,
            nutrientTableId,
            nutrientTableCode,
          });

          // Clear nutrients and fields for this submission food
          const record: UpdateRecord = {
            id: food.id,
            fields: JSON.stringify({}),
            nutrients: JSON.stringify({}),
          };

          // Include nutrient table references to maintain consistent record structure
          if (flags.shouldUpdateNutrientCodes) {
            record.nutrientTableId = nutrientTableId;
            record.nutrientTableCode = nutrientTableCode;
          }

          records.push(record);
          this.stats.clearedDueToMissingRecords++;
          continue;
        }

        // Detect changes
        const changeSet = (flags.shouldSyncFields || flags.shouldUpdateNutrientCodes) && currentMapping
          ? this.detectChanges(
              {
                code: food.code,
                englishName: food.englishName,
                localName: food.localName,
                nutrientTableId: food.nutrientTableId,
                nutrientTableCode: food.nutrientTableCode,
                fields: food.fields,
                nutrients: food.nutrients,
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
        const fieldsObj: Dictionary = { ...food.fields };

        if (flags.shouldSyncFields && currentMapping) {
          // syncFields = true: Full structural sync of fields.
          // Add new fields from nutrientData, update existing values, and prune obsolete ones.
          // Note: nutrientData depends on the mode.
          // In values-only mode, nutrientData comes from the stored reference (old record).
          // In values-and-codes mode, it comes from the current food mapping (new record).
          for (const field of nutrientData.fields) {
            if (!fieldsObj[field.name] || changeSet.fieldsAdded.includes(field.name)) {
              fieldsObj[field.name] = field.value;
              if (changeSet.fieldsAdded.includes(field.name)) {
                batchFieldsAdded++;
              }
            }
            else {
              // Update existing fields with current values
              fieldsObj[field.name] = field.value;
            }
          }

          // Optionally remove obsolete fields
          if (flags.shouldPruneFields) {
            const currentFieldNames = new Set(nutrientData.fields.map(f => f.name));
            for (const fieldName of Object.keys(fieldsObj)) {
              if (!currentFieldNames.has(fieldName)) {
                delete fieldsObj[fieldName];
                batchFieldsRemoved++;
              }
            }
          }
        }
        else {
          // syncFields = false:
          // Only update values of fields that already exist in the submission.
          // Do NOT add new fields or remove existing fields (structure preserved).
          const nutrientFieldMap = new Map(nutrientData.fields.map(f => [f.name, f.value]));
          for (const fieldName of Object.keys(fieldsObj)) {
            const newValue = nutrientFieldMap.get(fieldName);
            if (newValue !== undefined) {
              fieldsObj[fieldName] = newValue;
            }
            // Fields not present in nutrientData are left unchanged (not removed)
          }
        }

        // Calculate nutrients
        const portionWeight = portionWeights.get(food.id) ?? 0;
        let nutrientsObj: Dictionary;

        if (flags.shouldSyncFields) {
          // syncFields = true: Full replacement — build entirely from nutrientData.
          // New nutrients are added, dropped nutrients are removed.
          nutrientsObj = nutrientData.nutrients.reduce<Dictionary>((acc, { nutrientTypeId, unitsPer100g }) => {
            acc[nutrientTypeId.toString()] = (unitsPer100g * portionWeight) / 100.0;
            return acc;
          }, {});
        }
        else {
          // syncFields = false: Only recalculate nutrients already present in the submission.
          // Do NOT add new nutrients. Unresolvable nutrients (no longer in source) are zeroed out.
          const sourceNutrientMap = new Map(
            nutrientData.nutrients.map(n => [n.nutrientTypeId.toString(), n.unitsPer100g]),
          );
          nutrientsObj = { ...food.nutrients };
          for (const nutrientId of Object.keys(nutrientsObj)) {
            const unitsPer100g = sourceNutrientMap.get(nutrientId);
            if (unitsPer100g !== undefined) {
              nutrientsObj[nutrientId] = (unitsPer100g * portionWeight) / 100.0;
            }
            else {
              // Nutrient no longer in source record — zero out
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

        // Add nutrient table references if updating codes (maintain consistent structure)
        if (flags.shouldUpdateNutrientCodes) {
          record.nutrientTableId = nutrientTableId;
          record.nutrientTableCode = nutrientTableCode;
          if (changeSet.nutrientCodeChanged) {
            batchNutrientCodesUpdated++;
          }
        }

        records.push(record);
      }

      // Update database
      if (records.length > 0) {
        const columnsToUpdate: any = {
          fields: ({ cast, ref }: any) => cast(ref('data.fields'), 'jsonb'),
          nutrients: ({ cast, ref }: any) => cast(ref('data.nutrients'), 'jsonb'),
        };

        if (flags.shouldUpdateNutrientCodes) {
          columnsToUpdate.nutrientTableId = ({ ref }: any) => ref('data.nutrientTableId');
          columnsToUpdate.nutrientTableCode = ({ ref }: any) => ref('data.nutrientTableCode');
        }

        await this.kyselyDb.system
          .updateTable('surveySubmissionFoods')
          .from(values(records, 'data'))
          .set(columnsToUpdate)
          .whereRef('surveySubmissionFoods.id', '=', ({ cast, ref }) => cast(ref('data.id'), 'uuid'))
          .executeTakeFirst();
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
