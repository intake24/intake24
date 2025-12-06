import config from '@intake24/cli/config';
import { permissions as defaultPermissions } from '@intake24/common-backend/acl';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import { defaultAlgorithm } from '@intake24/common-backend/util';
import { KyselyDatabases } from '@intake24/db';

type Superuser = {
  name: string;
  email: string;
  password: string;
};

async function initDefaultData(db: KyselyDatabases) {
  await Promise.all(
    ['languages', 'locales', 'nutrient_units', 'nutrient_types']
      .map(table => db.system.deleteFrom(table as any).execute()),
  );

  const locales = await db.foods.selectFrom('locales').selectAll().execute();
  if (locales.length) {
    const langs = new Set<string>();
    locales.forEach((locale) => {
      langs.add(locale.adminLanguageId);
      langs.add(locale.respondentLanguageId);
    });

    // TODO: Fetch language details
    await db.system
      .insertInto('languages')
      .values(
        Array.from(langs).map(code => ({
          code,
          englishName: code,
          localName: code,
          countryFlagCode: code.split('-').at(0) || code,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
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
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

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
  const logger = mainLogger.child({ service: 'Init:db:system' });
  logger.info('Initializing system databases...');

  const db = new KyselyDatabases({
    environment: config.app.env,
    logger: mainLogger,
    databaseConfig: config.database,
  });

  try {
    db.init();
    await initAccessControl(db, superuser);
    await initDefaultData(db);

    logger.info('System databases initialized successfully.');
  }
  catch (error) {
    logger.error('Error initializing system databases:', error);
    throw error;
  }
  finally {
    await db.close();
  }
};
