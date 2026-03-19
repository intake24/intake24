import { intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import config from '@intake24/cli/config';
import { permissions as defaultPermissions } from '@intake24/common-backend/acl';
import { logger } from '@intake24/common-backend/services/logger';
import { KyselyDatabases } from '@intake24/db';

export default async (): Promise<void> => {
  intro(color.bgCyanBright(color.black('Synchronizing Access Control List (ACL)')));

  const db = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger,
    databaseConfig: config.database,
  });

  const now = new Date();

  try {
    await db.init();

    await db.system.transaction().execute(async (trx) => {
      // 1. Insert or update permissions in the database
      const permRecords = await trx
        .insertInto('permissions')
        .values(defaultPermissions.map(
          permission => ({
            ...permission,
            createdAt: now,
            updatedAt: now,
          }),
        ))
        .onConflict(oc => oc
          .columns(['name'])
          .doUpdateSet({
            displayName: eb => eb.ref('excluded.displayName'),
          }),
        )
        .returningAll()
        .execute();

      // 2. find superuser role
      const superuser = await db.system
        .selectFrom('roles')
        .where('name', '=', config.acl.roles.superuser)
        .selectAll()
        .executeTakeFirst();

      // 3. assign all permissions to superuser role
      if (superuser) {
        await trx.insertInto('permissionRole')
          .values(permRecords
            .map(({ id }) => ({
              permissionId: id,
              roleId: superuser.id,
              createdAt: now,
              updatedAt: now,
            })))
          .onConflict(oc => oc
            .columns(['permissionId', 'roleId'])
            .doNothing(),
          )
          .execute();
      }

      // 4. Remove permissions that are no longer in the default list
      await trx.deleteFrom('permissions')
        .where('name', 'not in', defaultPermissions.map(p => p.name))
        .where('name', 'not ilike', '%/respondent')
        .execute();
    });

    outro('ACL synchronized successfully.');
  }
  catch (error) {
    console.log(error);
    log.error(`Error synchronizing ACL: ${error}`);
  }
  finally {
    await db.close();
  }
};
