import type { CreationAttributes } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';
import type { JobType, QueueJob } from '@intake24/common/types';
import type {
  NutrientTableRecordRequest as ApiNutrientTableRecord,
  NutrientTableEntry,
  NutrientTableRequest,
} from '@intake24/common/types/http/admin';
import type { Transaction } from '@intake24/db';

import { NotFoundError } from '@intake24/api/http/errors';
import {
  NutrientTable,
  NutrientTableCsvMapping,
  NutrientTableCsvMappingField,
  NutrientTableCsvMappingNutrient,
  NutrientTableRecord,
  NutrientTableRecordField,
  NutrientTableRecordNutrient,
  Op,
} from '@intake24/db';

export type UploadCsvFileInput = {
  type: Extract<JobType, 'NutrientTableDataImport' | 'NutrientTableMappingImport'>;
  file: string;
  userId?: string;
};

function nutrientTableService({ db, scheduler }: Pick<IoC, 'db' | 'scheduler'>) {
  /**
   * Get nutrient table record with all CSV mappings
   *
   * @param {string} nutrientTableId
   * @returns {Promise<NutrientTableEntry>}
   */
  const getTable = async (nutrientTableId: string): Promise<NutrientTableEntry> => {
    const nutrientTable = await NutrientTable.findByPk(nutrientTableId, {
      include: [
        { association: 'csvMapping', required: true },
        { association: 'csvMappingFields', separate: true, order: [['columnOffset', 'ASC']] },
        {
          association: 'csvMappingNutrients',
          separate: true,
          order: [['columnOffset', 'ASC']],
        },
      ],
    });

    if (!nutrientTable || !nutrientTable.csvMapping)
      throw new NotFoundError();

    const { csvMapping, csvMappingFields = [], csvMappingNutrients = [] } = nutrientTable;

    return {
      ...nutrientTable.get(),
      csvMapping,
      csvMappingFields,
      csvMappingNutrients,
    };
  };

  /**
   * Create new nutrient table with all CSV mappings
   *
   * @param {NutrientTableRequest} input
   * @returns {Promise<NutrientTableEntry>}
   */
  const createTable = async (input: NutrientTableRequest): Promise<NutrientTableEntry> => {
    const { id, description } = input;

    return db.foods.transaction<NutrientTableEntry>(async (transaction) => {
      const nutrientTable = await NutrientTable.create({ id, description }, { transaction });
      const csvMapping = await NutrientTableCsvMapping.create(
        { nutrientTableId: id, ...input.csvMapping },
        { transaction },
      );

      const csvMappingFieldsInput = input.csvMappingFields.map(field => ({
        nutrientTableId: id,
        ...field,
      }));

      const csvMappingNutrientsInput = input.csvMappingNutrients.map(field => ({
        nutrientTableId: id,
        ...field,
      }));

      const [csvMappingFields, csvMappingNutrients] = await Promise.all([
        NutrientTableCsvMappingField.bulkCreate(csvMappingFieldsInput, { transaction }),
        NutrientTableCsvMappingNutrient.bulkCreate(csvMappingNutrientsInput, { transaction }),
      ]);

      return {
        ...nutrientTable.get(),
        csvMapping,
        csvMappingFields,
        csvMappingNutrients,
      };
    });
  };

  const updateCsvMappingFields = async (
    nutrientTableId: string,
    fields: NutrientTableRequest['csvMappingFields'],
    transaction?: Transaction,
  ): Promise<NutrientTableCsvMappingField[]> => {
    const fieldNames = fields.map(field => field.fieldName);
    await NutrientTableCsvMappingField.destroy({
      where: { nutrientTableId, fieldName: { [Op.notIn]: fieldNames } },
      transaction,
    });

    if (!fields.length)
      return [];

    const csvMappingFields = await NutrientTableCsvMappingField.findAll({
      where: { nutrientTableId },
      order: [['columnOffset', 'ASC']],
      transaction,
    });

    for (const field of fields) {
      const { fieldName, columnOffset } = field;

      const matchIdx = csvMappingFields.findIndex(item => item.fieldName === fieldName);

      if (matchIdx === -1) {
        const newField = await NutrientTableCsvMappingField.create(
          {
            nutrientTableId,
            fieldName,
            columnOffset,
          },
          { transaction },
        );
        csvMappingFields.push(newField);
        continue;
      }

      await csvMappingFields.at(matchIdx)?.update({ columnOffset }, { transaction });
    }

    return csvMappingFields;
  };

  const updateCsvMappingNutrients = async (
    nutrientTableId: string,
    nutrients: NutrientTableRequest['csvMappingNutrients'],
    transaction?: Transaction,
  ): Promise<NutrientTableCsvMappingNutrient[]> => {
    const nutrientTypes = nutrients.map(nutrient => nutrient.nutrientTypeId);
    await NutrientTableCsvMappingNutrient.destroy({
      where: { nutrientTableId, nutrientTypeId: { [Op.notIn]: nutrientTypes } },
      transaction,
    });

    if (!nutrients.length)
      return [];

    const csvMappingNutrients = await NutrientTableCsvMappingNutrient.findAll({
      where: { nutrientTableId },
      order: [['columnOffset', 'ASC']],
      transaction,
    });

    for (const nutrient of nutrients) {
      const { nutrientTypeId, columnOffset } = nutrient;

      const matchIdx = csvMappingNutrients.findIndex(
        item => item.nutrientTypeId === nutrientTypeId,
      );

      if (matchIdx === -1) {
        const newNutrient = await NutrientTableCsvMappingNutrient.create(
          {
            nutrientTableId,
            nutrientTypeId,
            columnOffset,
          },
          { transaction },
        );
        csvMappingNutrients.push(newNutrient);
        continue;
      }

      await csvMappingNutrients.at(matchIdx)?.update({ columnOffset }, { transaction });
    }

    return csvMappingNutrients;
  };

  /**
   * Update new nutrient table with all CSV mappings
   *
   * @param {string} nutrientTableId
   * @param {NutrientTableRequest} input
   * @returns {Promise<NutrientTableEntry>}
   */
  const updateTable = async (
    nutrientTableId: string,
    input: Omit<NutrientTableRequest, 'id'>,
  ): Promise<NutrientTableEntry> => {
    const { description } = input;

    const nutrientTable = await NutrientTable.findByPk(nutrientTableId, {
      include: [{ association: 'csvMapping', required: true }],
    });
    if (!nutrientTable || !nutrientTable.csvMapping)
      throw new NotFoundError();

    const { csvMapping } = nutrientTable;

    return db.foods.transaction(async (transaction) => {
      await nutrientTable.update({ description }, { transaction });
      await csvMapping.update(input.csvMapping, { transaction });

      const csvMappingFields = await updateCsvMappingFields(
        nutrientTableId,
        input.csvMappingFields,
        transaction,
      );

      const csvMappingNutrients = await updateCsvMappingNutrients(
        nutrientTableId,
        input.csvMappingNutrients,
        transaction,
      );

      return {
        ...nutrientTable.get(),
        csvMapping,
        csvMappingFields,
        csvMappingNutrients,
      };
    });
  };

  /**
   * Delete nutrient table
   *
   * @param {string} nutrientTableId
   * @returns {Promise<void>}
   */
  const deleteTable = async (nutrientTableId: string): Promise<void> => {
    const nutrientTable = await NutrientTable.findByPk(nutrientTableId, { attributes: ['id'] });
    if (!nutrientTable)
      throw new NotFoundError();

    await nutrientTable.destroy();
  };

  /**
   * Queue nutrient table tasks
   *
   * @param {QueueJob} input
   * @returns
   */
  const queueTask = async (input: QueueJob) => scheduler.jobs.addJob(input);

  const updateRecords = async (nutrientTableId: string, records: ApiNutrientTableRecord[]) => {
    await db.foods.transaction(async (transaction) => {
      const recordIds = records.map(record => record.recordId);

      // Find existing records ids matching nutrientTableId/nutrientTableRecordId
      const existingRecords = await NutrientTableRecord.findAll({
        where: {
          nutrientTableId,
          nutrientTableRecordId: recordIds,
        },
      });

      const recordCreateAttribs: CreationAttributes<NutrientTableRecord>[] = records.map(
        record => ({
          id: existingRecords.find(
            existing =>
              existing.nutrientTableId === nutrientTableId
              && existing.nutrientTableRecordId === record.recordId,
          )?.id,
          nutrientTableId,
          nutrientTableRecordId: record.recordId,
          name: record.name,
          localName: record.localName,
        }),
      );

      await NutrientTableRecord.bulkCreate(recordCreateAttribs, {
        updateOnDuplicate: ['name', 'localName'],
        transaction,
      });

      // Bulk create is not guaranteed to return the new record ids so query for them again
      const affectedRecords = await NutrientTableRecord.findAll({
        where: { nutrientTableId, nutrientTableRecordId: recordIds },
        transaction,
      });

      const recordIdList = affectedRecords.map(record => record.id);

      const recordIdMap = Object.fromEntries(
        affectedRecords.map(record => [record.nutrientTableRecordId, record.id]),
      );

      const recordNutrientCreateAttribs: CreationAttributes<NutrientTableRecordNutrient>[]
        = records.flatMap(record =>
          record.nutrients.map(nutrientRow => ({
            nutrientTableRecordId: recordIdMap[record.recordId],
            nutrientTypeId: nutrientRow[0],
            unitsPer100g: nutrientRow[1],
          })),
        );

      const recordFieldCreateAttribs: CreationAttributes<NutrientTableRecordField>[]
        = records.flatMap(record =>
          record.fields.map(fieldRow => ({
            nutrientTableRecordId: recordIdMap[record.recordId],
            name: fieldRow[0],
            value: fieldRow[1],
          })),
        );

      await NutrientTableRecordField.destroy({
        where: { nutrientTableRecordId: recordIdList },
        transaction,
      });

      await NutrientTableRecordField.bulkCreate(recordFieldCreateAttribs, { transaction });

      await NutrientTableRecordNutrient.destroy({
        where: { nutrientTableRecordId: recordIdList },
        transaction,
      });

      await NutrientTableRecordNutrient.bulkCreate(recordNutrientCreateAttribs, { transaction });
    });
  };

  return {
    getTable,
    createTable,
    updateTable,
    deleteTable,
    queueTask,
    updateRecords,
  };
}

export default nutrientTableService;

export type NutrientTableService = ReturnType<typeof nutrientTableService>;
