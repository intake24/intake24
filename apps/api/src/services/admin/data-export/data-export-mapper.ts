import type {
  ExportField,
  ExportFieldInfo,
  ExportFieldTransform,
  ExportRow,
} from './data-export-fields';
import { get } from 'lodash';

import type { IoC } from '@intake24/api/ioc';

export type ExportFieldTransformCallback<T = ExportRow> = (
  field: ExportField
) => ExportFieldTransform<T>;

export const userCustomFieldValue: ExportFieldTransformCallback
  = (field: ExportField): ExportFieldTransform =>
    ({ food }) =>
      food.meal?.submission?.user?.customFields?.find(item => field.id === item.name)?.value;

export const submissionCustomFieldValue: ExportFieldTransformCallback
  = (field: ExportField): ExportFieldTransform =>
    ({ food }) =>
      food.meal?.submission?.customFields?.find(item => field.id === item.name)?.value;

export const mealCustomFieldValue: ExportFieldTransformCallback
  = (field: ExportField): ExportFieldTransform =>
    ({ food }) =>
      food.meal?.customFields?.find(item => field.id === item.name)?.value;

export const foodCustomFieldValue: ExportFieldTransformCallback
  = (field: ExportField): ExportFieldTransform =>
    ({ food }) =>
      'customFields' in food
        ? food.customFields?.find(item => field.id === item.name)?.value
        : undefined;

export function foodFieldValue(field: ExportField): ExportFieldTransform {
  return ({ food }) =>
    'fields' in food ? food.fields?.find(item => field.id === item.fieldName)?.value : undefined;
}

export function foodNutrientValue(field: ExportField): ExportFieldTransform {
  return ({ food }) =>
    'nutrients' in food
      ? food.nutrients?.find(item => field.id === item.nutrientTypeId)?.amount
      : undefined;
}

export function portionSizeValue(field: ExportField): ExportFieldTransform {
  return ({ food }) =>
    'portionSizes' in food
      ? food.portionSizes?.find(item => field.id === item.name)?.value
      : undefined;
}

export function externalSourceField(field: ExportField): ExportFieldTransform {
  return ({ food }) => {
    const [sourceId, fieldId] = field.id.split(':');
    const record = food.externalSources?.find(item => sourceId === item.source);
    if (!record)
      return undefined;

    if (fieldId.startsWith('data.'))
      return get(record.data, fieldId.replace('data.', ''));

    // @ts-expect-error - TODO: fix this
    return record[fieldId];
  };
}

function dataExportMapper({ dataExportFields }: Pick<IoC, 'dataExportFields'>) {
  /**
   * Map record based fields (Survey submission / meal / food)
   *
   * @param {ExportField[]} fields
   * @param {ExportField[]} referenceFields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const getRecordFields = async (
    fields: ExportField[],
    referenceFields: ExportField[],
  ): Promise<ExportFieldInfo[]> =>
    fields.map((field) => {
      const match = referenceFields.find(refField => refField.id === field.id);

      const { id, label } = field;

      return { label: label ?? id, value: match?.value ?? id };
    });

  /**
   * Map custom field based fields
   *
   * @param {ExportField[]} fields
   * @param {ExportFieldTransformCallback} value
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const getCustomRecordFields = async (
    fields: ExportField[],
    value: ExportFieldTransformCallback,
  ): Promise<ExportFieldInfo[]> =>
    fields.map(field => ({ label: field.label, value: value(field) }));

  /**
   * User fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const user = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(fields, await dataExportFields.user());

  /**
   * User custom fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const userCustom = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, userCustomFieldValue);

  /**
   * Survey fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const survey = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(fields, await dataExportFields.survey());

  /**
   * Submission fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const submission = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(fields, await dataExportFields.submission());

  /**
   * Submission custom fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const submissionCustom = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, submissionCustomFieldValue);

  /**
   * Meal fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const meal = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(fields, await dataExportFields.meal());

  /**
   * Meal custom fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const mealCustom = (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, mealCustomFieldValue);

  /**
   * Food fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const food = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(fields, await dataExportFields.food());

  /**
   * Food custom fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const foodCustom = (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, foodCustomFieldValue);

  /**
   * Food composition fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const foodFields = (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, foodFieldValue);

  /**
   * Food nutrient fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const foodNutrients = (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, foodNutrientValue);

  /**
   * Portion sizes fields
   *
   * @param {ExportField[]} fields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const portionSizes = async (fields: ExportField[]): Promise<ExportFieldInfo[]> => {
    const portionSizeFields = await dataExportFields.portionSizes();

    const psfMap = portionSizeFields.reduce<Record<string, ExportField['value']>>(
      (acc, { id, value }) => {
        if (value)
          acc[id] = value;
        return acc;
      },
      {},
    );

    return fields.map(field => ({
      label: field.label,
      value: psfMap[field.id] ?? portionSizeValue(field),
    }));
  };

  const externalSources = async (fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(fields, externalSourceField);

  return {
    user,
    userCustom,
    survey,
    submission,
    submissionCustom,
    meal,
    mealCustom,
    food,
    foodCustom,
    foodFields,
    foodNutrients,
    portionSizes,
    externalSources,
  };
}

export default dataExportMapper;

export type DataExportMapper = ReturnType<typeof dataExportMapper>;
