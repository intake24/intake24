import { Redis } from 'ioredis';

import ioc from '@intake24/api/ioc';
import { permissions } from '@intake24/common-backend';
import {
  defaultMeals as defaultFeedbackMeals,
  feedbackOutputs as defaultFeedbackOutputs,
  feedbackStandardSections as defaultFeedbackSections,
  defaultTopFoods as defaultFeedbackTopFoods,
  feedbackPhysicalDataFields,
} from '@intake24/common/feedback';
import {
  defaultExport,
  defaultMeals,
  defaultPrompts,
  defaultSchemeSettings,
  defaultSearchSettings,
  defaultSessionSettings,
} from '@intake24/common/surveys';
import type { SystemLocaleAttributes } from '@intake24/common/types/http/admin';
import type { User, UserSurveyAlias } from '@intake24/db';
import {
  FAQ,
  FeedbackScheme,
  FoodsLocale,
  FoodsNutrientType,
  FoodsNutrientUnit,
  Language,
  Permission,
  Role,
  StandardUnit,
  Survey,
  SurveyScheme,
  SystemLocale,
  SystemNutrientType,
  SystemNutrientUnit,
} from '@intake24/db';

export type MockData = {
  foods: {
    locale: FoodsLocale;
  };
  system: {
    Language: Language;
    Locale: SystemLocale;
    FAQ: FAQ;
    FeedbackScheme: FeedbackScheme;
    SurveyScheme: SurveyScheme;
    Survey: Survey;
    role: Role;
    admin: User;
    user: User;
    respondent: UserSurveyAlias;
  };
};

export async function wipeRedis() {
  const { path, ...rest } = ioc.cradle.config.queue.redis;
  const redis = path ? new Redis(path, rest) : new Redis(rest);
  await redis.flushdb();
  redis.disconnect();
}

/**
 * Fill database with all available permissions
 *
 * @returns {Promise<void>}
 */
export async function setupPermissions(): Promise<void> {
  await Permission.bulkCreate(permissions);
}

export async function initDatabase(): Promise<MockData> {
  const language = await Language.create({
    code: 'en',
    englishName: 'United Kingdom',
    localName: 'United Kingdom',
    countryFlagCode: 'gb',
    textDirection: 'ltr',
    visibility: 'public',
  });

  const localeInput: Omit<SystemLocaleAttributes, 'code' | 'id' | 'visibility' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
    englishName: 'United Kingdom',
    localName: 'United Kingdom',
    respondentLanguageId: language.code,
    adminLanguageId: language.code,
    countryFlagCode: 'gb',
    textDirection: 'ltr',
    foodIndexEnabled: true,
    foodIndexLanguageBackendId: 'en',
  };

  const [foodsLocale, systemLocale] = await Promise.all([
    FoodsLocale.create({ id: 'en_GB', ...localeInput }),
    SystemLocale.create({ code: 'en_GB', ...localeInput, visibility: 'public' }),
  ]);

  const nutrientUnits = [
    { id: '1', description: 'Gram', symbol: 'g' },
    { id: '2', description: 'Milligram', symbol: 'mg' },
    { id: '3', description: 'Microgram', symbol: 'µg' },
    { id: '4', description: 'Kilocalorie', symbol: 'kcal' },
    { id: '5', description: 'Kilojoule', symbol: 'kJ' },
    { id: '6', description: 'International Units', symbol: 'IU' },
  ];

  const standardUnits = [
    { id: 'bags', name: 'Bags', estimateIn: { en: 'bags' }, howMany: { en: 'How many bags' } },
    { id: 'bars', name: 'Bars', estimateIn: { en: 'bars' }, howMany: { en: 'How many bars' } },
  ];

  await Promise.all([
    FoodsNutrientUnit.bulkCreate(nutrientUnits),
    SystemNutrientUnit.bulkCreate(nutrientUnits),
    StandardUnit.bulkCreate(standardUnits),
  ]);

  const nutrientTypes = [
    { id: '1', description: 'Energy (kcal)', unitId: '4' },
    { id: '2', description: 'Energy (kJ)', unitId: '5' },
    {
      id: '3',
      description: 'Energy, total metabolisable (kcal, including dietary fibre)',
      unitId: '4',
    },
    {
      id: '4',
      description: 'Energy, total metabolisable, available carbohydrate, FSANZ (kcal)',
      unitId: '4',
    },
    {
      id: '5',
      description: 'Energy, total metabolisable, available carbohydrate, FSANZ (kJ)',
      unitId: '5',
    },
    {
      id: '6',
      description: 'Energy, total metabolisable, carbohydrate by difference, FSANZ (kcal) Units',
      unitId: '4',
    },
    {
      id: '7',
      description: 'Energy, total metabolisable, carbohydrate by difference, FSANZ (kJ)',
      unitId: '5',
    },
    { id: '8', description: 'Water', unitId: '1' },
    { id: '9', description: 'Total nitrogen', unitId: '1' },
    { id: '10', description: 'Nitrogen conversion factor', unitId: '1' },
  ];

  await Promise.all([
    FoodsNutrientType.bulkCreate(nutrientTypes),
    SystemNutrientType.bulkCreate(nutrientTypes),
  ]);

  const faq = await FAQ.create({ name: 'Test FAQ', content: [] });

  const [feedbackScheme, surveyScheme] = await Promise.all([
    FeedbackScheme.create({
      name: 'Default',
      type: 'default',
      visibility: 'public',
      outputs: [...defaultFeedbackOutputs],
      physicalDataFields: [...feedbackPhysicalDataFields],
      sections: [...defaultFeedbackSections],
      topFoods: { ...defaultFeedbackTopFoods },
      meals: { ...defaultFeedbackMeals },
      cards: [],
      demographicGroups: [],
      henryCoefficients: [],
    }),
    SurveyScheme.create({
      name: 'Default',
      settings: defaultSchemeSettings,
      visibility: 'public',
      prompts: defaultPrompts,
      meals: [...defaultMeals],
      dataExport: defaultExport,
    }),
  ]);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const survey = await Survey.create({
    slug: 'test-survey',
    name: 'Test Survey Name',
    state: 'notStarted',
    startDate,
    endDate,
    feedbackSchemeId: feedbackScheme.id,
    surveySchemeId: surveyScheme.id,
    localeId: systemLocale.id,
    allowGenUsers: false,
    notifications: [],
    supportEmail: 'testSupportEmail@example.com',
    session: { ...defaultSessionSettings },
    searchSettings: { ...defaultSearchSettings },
    surveySchemeOverrides: { meals: [], prompts: [], settings: {} },
  });

  await setupPermissions();

  const adminRole = await Role.create({ name: 'admin-role', displayName: 'Admin Role' });
  const permissions = await Permission.findAll();
  await adminRole.$set('permissions', permissions);

  const admin = await ioc.cradle.adminUserService.create({
    email: 'testAdmin@example.com',
    password: 'testAdminPassword',
    verifiedAt: new Date(),
    permissions: [],
    roles: [adminRole.id],
  });

  const role = await Role.create({ name: 'test-role', displayName: 'Test Role' });

  const respondent = await ioc.cradle.adminSurveyService.createRespondent(survey, {
    username: 'testRespondent',
    password: 'testRespondentPassword',
  });

  const permission = await ioc.cradle.adminSurveyService.getSurveyRespondentPermission(survey.slug);
  const user = await ioc.cradle.adminUserService.create({
    email: 'testUser@example.com',
    password: 'testUserPassword',
    verifiedAt: new Date(),
    permissions: [permission.id],
    roles: [role.id],
  });

  return {
    foods: {
      locale: foodsLocale,
    },
    system: {
      Language: language,
      Locale: systemLocale,
      FAQ: faq,
      FeedbackScheme: feedbackScheme,
      SurveyScheme: surveyScheme,
      Survey: survey,
      role,
      admin,
      user,
      respondent,
    },
  };
}

export async function wipeDatabase(): Promise<void> {
  for (const model of Object.values(ioc.cradle.db.foods.models))
    await model.truncate({ cascade: true });

  for (const model of Object.values(ioc.cradle.db.system.models))
    await model.truncate({ cascade: true });
}
