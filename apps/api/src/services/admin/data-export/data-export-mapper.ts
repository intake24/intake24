import type {
  ExportField,
  ExportFieldInfo,
  ExportFieldTransform,
  ExportRow,
} from './data-export-fields';
import { get } from 'lodash';
import type { IoC } from '@intake24/api/ioc';
import type { ExportSectionId } from '@intake24/common/surveys';

export type ExportFieldTransformCallback<T = ExportRow> = (
  field: ExportField,
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
   * @param {ExportSectionId} section
   * @param {ExportField[]} fields
   * @param {ExportField[]} referenceFields
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const getRecordFields = async (section: ExportSectionId, fields: ExportField[], referenceFields: ExportField[]): Promise<ExportFieldInfo[]> =>
    fields.map((field) => {
      const match = referenceFields.find(refField => refField.id === field.id);

      const { id, label } = field;

      return { label: label ?? `${section}:${id}`, value: match?.value ?? id };
    });

  /**
   * Map custom field based fields
   *
   * @param {ExportSectionId} section
   * @param {ExportField[]} fields
   * @param {ExportFieldTransformCallback} value
   * @returns {Promise<ExportFieldInfo[]>}
   */
  const getCustomRecordFields = async (
    section: ExportSectionId,
    fields: ExportField[],
    value: ExportFieldTransformCallback,
  ): Promise<ExportFieldInfo[]> =>
    fields.map(field => ({ label: field.label ?? `${section}:${field.id}`, value: value(field) }));

  const user = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(section, fields, await dataExportFields.user());

  const userCustom = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, userCustomFieldValue);

  const survey = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(section, fields, await dataExportFields.survey());

  const submission = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(section, fields, await dataExportFields.submission());

  const submissionCustom = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, submissionCustomFieldValue);

  const meal = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(section, fields, await dataExportFields.meal());

  const mealCustom = (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, mealCustomFieldValue);

  const food = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getRecordFields(section, fields, await dataExportFields.food());

  const foodCustom = (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, foodCustomFieldValue);

  const foodFields = (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, foodFieldValue);

  const foodNutrients = (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, foodNutrientValue);

  const portionSizes = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> => {
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
      label: field.label ?? `${section}:${field.id}`,
      value: psfMap[field.id] ?? portionSizeValue(field),
    }));
  };

  const externalSources = async (section: ExportSectionId, fields: ExportField[]): Promise<ExportFieldInfo[]> =>
    getCustomRecordFields(section, fields, externalSourceField);

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
