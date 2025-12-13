import { log } from '@clack/prompts';
import axios from 'axios';
import config from '@intake24/cli/config';
import { permissions as defaultPermissions } from '@intake24/common-backend/acl';
import { logger } from '@intake24/common-backend/services/logger';
import { defaultAlgorithm } from '@intake24/common-backend/util';
import {
  associatedFoodsPrompt,
  editMealPrompt,
  finalPrompt,
  foodSearchPrompt,
  infoPrompt,
  mealAddPrompt,
  mealGapPrompt,
  mealTimePrompt,
  missingFoodPrompt,
  noMoreInformationPrompt,
  portionSizePrompts,
  readyMealPrompt,
  submitPrompt,
} from '@intake24/common/prompts';
import { defaultExport, defaultMeals, defaultSchemeSettings, RecallPrompts } from '@intake24/common/surveys';
import { KyselyDatabases } from '@intake24/db';

type Superuser = {
  name: string;
  email: string;
  password: string;
};

const IETF_LANGUAGE_TAG_URL = 'https://cdn.simplelocalize.io/public/v1/locales';

type IetfLanguageCountry = {
  code: string;
  name: string;
  name_local: string;
};

type IetfLanguage = {
  name: string;
  name_local: string;
  countries: IetfLanguageCountry[];
};

type IetfLanguageTag = {
  locale: string;
  language: IetfLanguage;
  country?: {
    code: string;
    name: string;
    name_local: string;
  };
};

async function fetchIetfLanguageTags(): Promise<IetfLanguageTag[]> {
  try {
    const res = await axios.get(IETF_LANGUAGE_TAG_URL);
    log.info(`Fetched IETF language tags from ${IETF_LANGUAGE_TAG_URL}`);
    if (res.status !== 200 || !res.data || res.data.length === 0 || !Array.isArray(res.data)) {
      log.error(`Invalid response or response payload: response ${res.status}`);
      throw new Error(`Invalid response or response payload for IETF language tags.\n Response payload (first 500 chars): ${JSON.stringify(res.data).slice(0, 500)}...`);
    }
    return res.data as IetfLanguageTag[];
  }
  catch (error) {
    log.error(`Error in fetching and parsing IETF language tags from ${IETF_LANGUAGE_TAG_URL}. `);
    throw error;
  }
}

async function initDefaultData(db: KyselyDatabases) {
  log.step('Initializing default data...');
  await Promise.all(
    (['languages', 'locales', 'nutrientUnits', 'nutrientTypes', 'surveySchemes'] as const)
      .map(table => db.system.deleteFrom(table).execute()),
  );
  log.success('Cleared existing default data.');

  const locales = await db.foods.selectFrom('locales').selectAll().execute();
  if (locales.length) {
    const ietfLanguageTags = await fetchIetfLanguageTags();
    const langs = new Set<string>();
    locales.forEach((locale) => {
      langs.add(locale.adminLanguageId);
      langs.add(locale.respondentLanguageId);
    });
    log.success('Collected language codes from foods.locales table.');

    const languageRows = Array.from(langs).map((code) => {
      const ietf_locale = (ietfLanguageTags as Array<{ locale: string; language: any; country: any }>)
        .find((tag) => {
          return (tag.locale === code) || (tag.locale.split('-')[0] === code.split('-')[0]);
        });

      let englishName = code;
      let localName = code;
      if (code.includes('-')) {
        englishName = ietf_locale?.language.countries.find((country: { code: string }) => country.code === code.split('-')[1])?.name || code;
        localName = ietf_locale?.language.countries.find((country: { code: string }) => country.code === code.split('-')[1])?.name_local || code;
      }
      else {
        englishName = ietf_locale?.language.name || code;
        localName = ietf_locale?.language.name_local || code;
      }
      const localeWithLang = locales.find(
        locale => locale.adminLanguageId === code || locale.respondentLanguageId === code,
      );
      const countryFlagCode = localeWithLang?.countryFlagCode ?? 'gb';
      const textDirection = localeWithLang?.textDirection ?? 'ltr';

      return {
        code,
        englishName,
        localName,
        countryFlagCode,
        textDirection,
        visibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    await db.system
      .insertInto('languages')
      .values(languageRows)
      .execute();
    log.success('Inserted default languages into system.languages table.');

    await db.system
      .insertInto('locales')
      .values(
        locales.map((locale) => {
          const { id: code, ...rest } = locale;

          return {
            code,
            ...rest,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
      )
      .execute();
    log.success('Inserted default locales into system.locales table.');
  }

  const nutrientUnits = await db.foods.selectFrom('nutrientUnits').selectAll().execute();
  if (nutrientUnits.length) {
    await db.system.insertInto('nutrientUnits').values(nutrientUnits).execute();
    log.success('Inserted default nutrient units into system.nutrientUnits table.');
  }

  const nutrientTypes = await db.foods.selectFrom('nutrientTypes').selectAll().execute();
  if (nutrientTypes.length) {
    await db.system.insertInto('nutrientTypes').values(nutrientTypes).execute();
    log.success('Inserted default nutrient types into system.nutrientTypes table.');
  }

  const prompts: RecallPrompts = {
    preMeals: [
      {
        ...infoPrompt,
        id: 'welcome',
        i18n: {
          name: { en: 'Welcome' },
          description: { en: 'Welcome to the dietary survey.' },
        },
      },
      mealAddPrompt,
    ],
    meals: {
      preFoods: [
        mealTimePrompt,
        editMealPrompt,
      ],
      foods: [
        ...portionSizePrompts,
        foodSearchPrompt,
        associatedFoodsPrompt,
        missingFoodPrompt,
        noMoreInformationPrompt,
      ],
      postFoods: [
        readyMealPrompt,
        noMoreInformationPrompt,
      ],
      foodsDeferred: [],
    },
    postMeals: [
      mealGapPrompt,
    ],
    submission: [
      {
        ...submitPrompt,
        i18n: {
          name: { en: 'Submit' },
          description: { en: 'You are about to submit your dietary survey.' },
        },
      },
      {
        ...finalPrompt,
        i18n: {
          name: { en: 'Complete' },
          description: { en: 'Thank you for completing the dietary survey.' },
        },
      },
    ],
  };

  await db.system.insertInto('surveySchemes').values({
    name: 'Default',
    settings: JSON.stringify(defaultSchemeSettings),
    meals: JSON.stringify(defaultMeals),
    prompts: JSON.stringify(prompts),
    dataExport: JSON.stringify(defaultExport),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).executeTakeFirst();
  log.success('Inserted default survey scheme into system.surveySchemes table.');
}

async function initAccessControl(db: KyselyDatabases, superuser: Superuser) {
  log.step('Processing default access control initialization...');
  await Promise.all(
    ['permissions', 'roles', 'users'].map(table => db.system.deleteFrom(table as any).execute()),
  );
  log.success('Cleared existing access control data.');

  /*
  * Create system admin user
  */
  const suUser = await db.system
    .insertInto('users')
    .values({
      name: superuser.name,
      email: superuser.email,
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  log.success('Created superuser account.');

  const { salt, hash } = await defaultAlgorithm.hash(superuser.password);
  await db.system.insertInto('userPasswords').values({
    userId: suUser.id,
    passwordHasher: defaultAlgorithm.id,
    passwordHash: hash,
    passwordSalt: salt,
  }).executeTakeFirstOrThrow();
  log.success('Set password for superuser account.');

  /*
  * Create system admin role
  */
  const suRole = await db.system
    .insertInto('roles')
    .values({
      name: config.acl.roles.superuser,
      displayName: config.acl.roles.superuser,
      description: 'Role gets assigned with all permissions created in system.',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  log.success('Created superuser role.');

  /*
  * Set superuser role to admin user
  */
  await db.system
    .insertInto('roleUser')
    .values({
      roleId: suRole.id,
      userId: suUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();
  log.success('Assigned superuser role to superuser account.');
  /*
  * Populate permissions
  */
  const permissions = await db.system
    .insertInto('permissions')
    .values(
      defaultPermissions.map(perm => ({
        name: perm.name,
        displayName: perm.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    .returningAll()
    .execute();
  log.success('Inserted default permissions.');

  await db.system
    .insertInto('permissionRole')
    .values(
      permissions.map(perm => ({
        permissionId: perm.id,
        roleId: suRole.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    .execute();
  log.success('Assigned all permissions to superuser role.');
  log.success('Access control initialization completed.');
}

export type InitDbSystemArgs = {
  superuser: {
    name: string;
    email: string;
    password: string;
  };
};

export default async ({ superuser }: InitDbSystemArgs): Promise<void> => {
  const db = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger,
    databaseConfig: config.database,
  });

  try {
    db.init();
    await initAccessControl(db, superuser);
    await initDefaultData(db);

    log.success('System databases initialized successfully.');
  }
  catch (error) {
    log.error(`Error initializing system databases: ${error}`);
  }
  finally {
    await db.close();
  }
};
