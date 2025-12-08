import axios from 'axios';
import config from '@intake24/cli/config';
import { permissions as defaultPermissions } from '@intake24/common-backend/acl';
import { logger, logger as mainLogger } from '@intake24/common-backend/services/logger';
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
import sequelizeMetaNames from './sequelize-meta.json';
import tasks from './tasks.json';

async function fetchIetfLanguageTags(): Promise<any[]> {
  try {
    const res = await axios.get(config.services.ietfLocales.url);
    process.stdout.write(`Fetched IETF language tags from ${config.services.ietfLocales.url}\n`);
    if (res.status !== 200 || !res.data || res.data.length === 0 || !Object.hasOwn(res.data[0], 'locale')) {
      process.stdout.write(`Invalid response or response payload: response ${res.status}, data (first 500 chars): ${JSON.stringify(res.data).slice(0, 500)}...`);
      throw new Error('Invalid response or response payload for IETF language tags.');
    }
    return res.data;
  }
  catch (error) {
    process.stdout.write(`Failed to fetch IETF language tags from ${config.services.ietfLocales.url}.\n`);
    throw error;
  }
}
type Superuser = {
  name: string;
  email: string;
  password: string;
};

async function initDefaultData(db: KyselyDatabases) {
  await Promise.all(
    ['languages', 'locales', 'nutrientUnits', 'nutrientTypes', 'sequelizeMeta', 'tasks', 'surveySchemes']
      .map(table => db.system.deleteFrom(table as any).execute()),
  );

  const locales = await db.foods.selectFrom('locales').selectAll().execute();
  if (locales.length) {
    const ietfLanguageTags = await fetchIetfLanguageTags();
    const langs = new Set<string>();
    locales.forEach((locale) => {
      langs.add(locale.adminLanguageId);
      langs.add(locale.respondentLanguageId);
    });

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
  }

  const nutrientUnits = await db.foods.selectFrom('nutrientUnits').selectAll().execute();
  if (nutrientUnits.length) {
    await db.system.insertInto('nutrientUnits').values(nutrientUnits).execute();
  }

  const nutrientTypes = await db.foods.selectFrom('nutrientTypes').selectAll().execute();
  if (nutrientTypes.length) {
    await db.system.insertInto('nutrientTypes').values(nutrientTypes).execute();
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

  await db.system
    .insertInto('sequelizeMeta')
    .values(sequelizeMetaNames)
    .execute();

  await db.system
    .insertInto('tasks')
    .values(
      tasks.map(task => ({
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    .execute();
}

async function initAccessControl(db: KyselyDatabases, superuser: Superuser) {
  await Promise.all(
    ['permissions', 'roles', 'users'].map(table => db.system.deleteFrom(table as any).execute()),
  );

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

  const { salt, hash } = await defaultAlgorithm.hash(superuser.password);
  await db.system.insertInto('userPasswords').values({
    userId: suUser.id,
    passwordHasher: defaultAlgorithm.id,
    passwordHash: hash,
    passwordSalt: salt,
  }).executeTakeFirstOrThrow();

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
}

export type InitDbSystemArgs = {
  superuser: {
    name: string;
    email: string;
    password: string;
  };
};

export default async ({ superuser }: InitDbSystemArgs): Promise<void> => {
  process.stdout.write('Initializing system databases...\n');

  const db = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger: mainLogger,
    databaseConfig: config.database,
  });

  try {
    db.init();
    await initAccessControl(db, superuser);
    await initDefaultData(db);

    process.stdout.write('System databases initialized successfully.');
  }
  catch (error) {
    logger.error('Error initializing system databases:', error);
    throw error;
  }
  finally {
    await db.close();
  }
};
