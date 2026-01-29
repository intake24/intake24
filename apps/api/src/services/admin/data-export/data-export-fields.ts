import type { FieldInfo } from '@json2csv/plainjs';

import type { Prompt } from '@intake24/common/prompts';
import type { ExportField as BaseExportField } from '@intake24/common/surveys';
import type { SurveyScheme } from '@intake24/db';

import { differenceInMinutes } from 'date-fns';
import { orderBy } from 'lodash-es';
import stringify from 'safe-stable-stringify';
import { UAParser } from 'ua-parser-js';

import { externalSources as externalSourceProviders } from '@intake24/common/prompts';
import { fromTime } from '@intake24/common/util';
import {
  NutrientTableCsvMappingField,
  SurveySubmissionFood,
  SurveySubmissionMissingFood,
  SystemNutrientType,
  UserCustomField,
} from '@intake24/db';

export type ExportRow = {
  food: SurveySubmissionFood | SurveySubmissionMissingFood;
  custom: { mealIndex: number };
};

export type ExportFieldTransform<T = ExportRow> = (row: T) => string | number | null | undefined;

export type ExportFieldInfo = FieldInfo<
  ExportRow,
  /* string | number | null | undefined */ unknown
>;

export type ExportField = BaseExportField & Partial<Pick<ExportFieldInfo, 'value'>>;

export const EMPTY = 'N/A';

function dataExportFields() {
  /**
   * Helper to map custom Prompt to ExportField
   *
   * @param {Prompt} prompt
   * @returns {ExportField}
   */
  const customPromptMapper = ({ id, name: label }: Prompt): ExportField => ({ id, label });

  /**
   * Helper to filter custom Prompt to ExportField
   *
   * @param {string} [component]
   */
  const customPromptFilter = (component?: string) =>
    (prompt: Prompt): boolean => prompt.type === 'custom' && (!component || prompt.component === component);

  /**
   * User fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const user = async (): Promise<ExportField[]> => [
    {
      id: 'id',
      label: 'User ID',
      value: ({ food }: ExportRow) => food.meal?.submission?.user?.id,
    },
    {
      id: 'email',
      label: 'User Email',
      value: ({ food }: ExportRow) => food.meal?.submission?.user?.email,
    },
    {
      id: 'phone',
      label: 'User Phone',
      value: ({ food }: ExportRow) => food.meal?.submission?.user?.phone,
    },
    {
      id: 'name',
      label: 'User Name',
      value: ({ food }: ExportRow) => food.meal?.submission?.user?.name,
    },
    {
      id: 'simpleName',
      label: 'User Simple Name',
      value: ({ food }: ExportRow) => food.meal?.submission?.user?.simpleName,
    },
  ];

  /**
   * User custom fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const userCustom = async (): Promise<ExportField[]> => {
    type UserCustomFieldDistinctValue = { DISTINCT: string };
    const records: UserCustomFieldDistinctValue[] = await UserCustomField.aggregate(
      'name',
      'DISTINCT',
      { plain: false },
    );
    const fields = records.map(({ DISTINCT }) => ({ id: DISTINCT, label: DISTINCT }));

    return orderBy(fields, 'id');
  };

  /**
   * Survey fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const survey = async (): Promise<ExportField[]> => [
    {
      id: 'id',
      label: 'Survey ID',
      value: ({ food }: ExportRow) => food.meal?.submission?.surveyId,
    },
    {
      id: 'username',
      label: 'Survey Alias / username',
      value: ({ food }: ExportRow) => {
        const aliases = food.meal?.submission?.user?.aliases;
        return aliases?.at(0)?.username;
      },
    },
    {
      id: 'slug',
      label: 'Survey Slug',
      value: ({ food }: ExportRow) => food.meal?.submission?.survey?.slug,
    },
  ];

  /**
   * Submission fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const submission = async (): Promise<ExportField[]> => [
    {
      id: 'id',
      label: 'Submission ID',
      value: ({ food }: ExportRow) => food.meal?.submission?.id,
    },
    {
      id: 'startTime',
      label: 'Start DateTime',
      value: ({ food }: ExportRow) => food.meal?.submission?.startTime?.toISOString(),
    },
    {
      id: 'endTime',
      label: 'End DateTime',
      value: ({ food }: ExportRow) => food.meal?.submission?.endTime?.toISOString(),
    },
    {
      id: 'recallDate',
      label: 'Recall Date',
      value: ({ food }: ExportRow) => food.meal?.submission?.recallDate,
    },
    {
      id: 'recallDuration',
      label: 'Recall Duration (mins)',
      value: ({ food }: ExportRow) => {
        const { startTime, endTime } = food.meal?.submission ?? {};
        if (!startTime || !endTime)
          return undefined;

        return differenceInMinutes(endTime, startTime);
      },
    },
    {
      id: 'submissionTime',
      label: 'Submission DateTime',
      value: ({ food }: ExportRow) => food.meal?.submission?.submissionTime?.toISOString(),
    },
    {
      id: 'wakeUpTime',
      label: 'Wake-Up Time',
      value: ({ food }: ExportRow) => food.meal?.submission?.wakeUpTime,
    },
    {
      id: 'sleepTime',
      label: 'Sleep Time',
      value: ({ food }: ExportRow) => food.meal?.submission?.sleepTime,
    },
    {
      id: 'userAgent',
      label: 'User Agent',
      value: ({ food }: ExportRow) => UAParser(food.meal?.submission?.userAgent ?? undefined).ua,
    },
    {
      id: 'browser',
      label: 'Browser',
      value: ({ food }: ExportRow) => {
        const uaInfo = UAParser(food.meal?.submission?.userAgent ?? undefined);
        return [uaInfo.browser.name, uaInfo.browser.version].filter(Boolean).join(' | ');
      },
    },
    {
      id: 'engine',
      label: 'Engine',
      value: ({ food }: ExportRow) => {
        const uaInfo = UAParser(food.meal?.submission?.userAgent ?? undefined);
        return [uaInfo.engine.name, uaInfo.engine.version].filter(Boolean).join(' | ');
      },
    },
    {
      id: 'device',
      label: 'Device',
      value: ({ food }: ExportRow) => {
        const uaInfo = UAParser(food.meal?.submission?.userAgent ?? undefined);
        return [uaInfo.device.model, uaInfo.device.type, uaInfo.device.vendor]
          .filter(Boolean)
          .join(' | ');
      },
    },
    {
      id: 'os',
      label: 'OS',
      value: ({ food }: ExportRow) => {
        const uaInfo = UAParser(food.meal?.submission?.userAgent ?? undefined);
        return [uaInfo.os.name, uaInfo.os.version].filter(Boolean).join(' | ');
      },
    },
    {
      id: 'cpu',
      label: 'CPU',
      value: ({ food }: ExportRow) =>
        UAParser(food.meal?.submission?.userAgent ?? undefined).cpu.architecture,
    },
  ];

  /**
   * Submission custom fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const submissionCustom = async (surveyScheme: SurveyScheme): Promise<ExportField[]> => {
    const { preMeals, postMeals, submission } = surveyScheme.prompts;
    return [...preMeals, ...postMeals, ...submission]
      .filter(customPromptFilter())
      .map(customPromptMapper);
  };

  /**
   * Meal fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const meal = async (): Promise<ExportField[]> => [
    { id: 'index', label: 'Meal index', value: ({ custom }: ExportRow) => custom.mealIndex },
    { id: 'id', label: 'Meal ID', value: ({ food }: ExportRow) => food.meal?.id },
    { id: 'name', label: 'Meal name', value: ({ food }: ExportRow) => food.meal?.name },
    {
      id: 'time',
      label: 'Meal time',
      value: ({ food }: ExportRow) =>
        food.meal
          ? fromTime({ hours: food.meal.hours, minutes: food.meal.minutes })
          : undefined,
    },
    { id: 'duration', label: 'Meal duration', value: ({ food }: ExportRow) => food.meal?.duration },
  ];

  /**
   * Meal custom fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const mealCustom = async (surveyScheme: SurveyScheme): Promise<ExportField[]> => {
    const {
      meals: { preFoods, postFoods },
    } = surveyScheme.prompts;

    return [...preFoods, ...postFoods].filter(customPromptFilter()).map(customPromptMapper);
  };

  /**
   * Food fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const food = async (): Promise<ExportField[]> => [
    // Common fields for food and missing food
    {
      id: 'index',
      label: 'Food index',
      value: 'food.index',
    },
    { id: 'parentId', label: 'Parent food ID', value: 'food.parentId' },

    // Food fields
    {
      id: 'id',
      label: 'Food ID',
      value: ({ food }: ExportRow) => (food instanceof SurveySubmissionFood ? food.id : undefined),
    },
    { id: 'code', label: 'Food code', value: 'food.code' },
    { id: 'englishName', label: 'Name (en)', value: 'food.englishName' },
    { id: 'localName', label: 'Name (local)', value: 'food.localName' },
    { id: 'locale', label: 'Locale code', value: 'food.locale' },
    { id: 'readyMeal', label: 'Ready meal', value: 'food.readyMeal' },
    { id: 'searchTerm', label: 'Search term', value: 'food.searchTerm' },
    { id: 'reasonableAmount', label: 'Reasonable amount', value: 'food.reasonableAmount' },
    {
      id: 'barcode',
      label: 'Barcode',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionFood ? food.barcode : undefined,
    },
    {
      id: 'brand',
      label: 'Brand',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionFood ? food.brand : undefined,
    },
    { id: 'nutrientTableId', label: 'Nutrient table name', value: 'food.nutrientTableId' },
    { id: 'nutrientTableCode', label: 'Nutrient table code', value: 'food.nutrientTableCode' },

    // Missing food fields
    {
      id: 'missingId',
      label: 'Missing ID',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.id : undefined,
    },
    { id: 'missingName', label: 'Missing name', value: 'food.name' },
    {
      id: 'missingBarcode',
      label: 'Missing barcode',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.barcode : undefined,
    },
    {
      id: 'missingBrand',
      label: 'Missing brand',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.brand : undefined,
    },
    {
      id: 'missingDescription',
      label: 'Missing description',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.description : undefined,
    },
    {
      id: 'missingPortionSize',
      label: 'Missing portion size',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.portionSize : undefined,
    },
    {
      id: 'missingLeftovers',
      label: 'Missing leftovers',
      value: ({ food }: ExportRow) =>
        food instanceof SurveySubmissionMissingFood ? food.leftovers : undefined,
    },
  ];

  /**
   * Food custom fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const foodCustom = async (surveyScheme: SurveyScheme): Promise<ExportField[]> => {
    const { preMeals, postMeals, meals: { foods } } = surveyScheme.prompts;
    return [
      ...foods.filter(customPromptFilter()),
      ...[...preMeals, ...postMeals].filter(customPromptFilter('aggregate-choice-prompt')),
    ].map(customPromptMapper);
  };

  /**
   * Food composition fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const foodFields = async (): Promise<ExportField[]> => {
    const fields = await NutrientTableCsvMappingField.findAll({ attributes: ['fieldName'] });

    const fieldNames = fields.map(({ fieldName }) => fieldName);

    return [...new Set(fieldNames)].map(name => ({ id: name, label: name }));
  };

  /**
   * Food nutrient fields
   *
   * @returns {Promise<ExportField[]>}
   */
  const foodNutrients = async (): Promise<ExportField[]> => {
    const types = await SystemNutrientType.findAll({ attributes: ['id', 'description'] });

    return types.map(({ id, description }) => ({ id, label: description }));
  };

  /**
   * Portion size fields
   * TODO: Pull from DB? labels to translations?
   *
   * @returns {Promise<ExportField[]>}
   */
  const portionSizes = async (): Promise<ExportField[]> => [
    { id: 'method', label: 'Portion method', value: 'food.portionSizeMethodId' },
    // Stringified portion size fields
    {
      id: 'portion',
      label: 'Portion',
      value: ({ food }: ExportRow) => food instanceof SurveySubmissionFood ? stringify(food.portionSize) : undefined,
    },
    // servingWeight - leftoversWeight
    {
      id: 'portionWeight',
      label: 'Portion Weight',
      value: ({ food }: ExportRow) => {
        if (food instanceof SurveySubmissionMissingFood)
          return undefined;

        const { servingWeight, leftoversWeight } = food.portionSize;
        if (typeof servingWeight !== 'number' || typeof leftoversWeight !== 'number')
          return undefined;

        return servingWeight - leftoversWeight;
      },
    },
  ];

  const externalSources = async (): Promise<ExportField[]> => externalSourceProviders.reduce<ExportField[]>((acc, source) => {
    return acc.concat([
      {
        id: `${source}:id`,
        label: `${source}: ID`,
      },
      {
        id: `${source}:source`,
        label: `${source}: Source`,
      },
      {
        id: `${source}:searchTerm`,
        label: `${source}: Search term`,
      },
      {
        id: `${source}:type`,
        label: `${source}: Type`,
      },
      {
        id: `${source}:data`,
        label: `${source}: Data`,
      },
    ]);
  }, []);

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

export default dataExportFields;

export type DataExportFields = ReturnType<typeof dataExportFields>;
