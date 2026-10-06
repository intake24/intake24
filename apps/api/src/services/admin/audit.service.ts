import type { ExpressionBuilder, Transaction } from 'kysely';

import type { IoC } from '@intake24/api/ioc';
import type { DatabaseType } from '@intake24/common/types';
import type { AuditEntry, AuditLog, AuditLogAttributes, AuditTableAttributes, AuditTablesRequest, AuditTablesResponse } from '@intake24/common/types/http/admin';
import type { Kysely } from '@intake24/db/kysely';
import type { AuditDB, AuditTableLinks } from '@intake24/db/queries/audit';

import { sql } from 'kysely';
import { snakeCase } from 'lodash-es';

import { databaseTypes } from '@intake24/common/types';
import {
  auditFunction,
  availableTables,
  checkIfUUIDv7Exists,
  createTriggers,
  createUUIDv7Function,
  dropTriggers,
  jsonbDiffFunction,
  tableInfoSql,

} from '@intake24/db/queries/audit';

type TableMap = Record<string, Partial<Record<DatabaseType, AuditTableLinks[]>>>;

function auditService({ cache, kyselyDb }: Pick<IoC, 'cache' | 'kyselyDb'>) {
  async function setup(trx: Transaction<AuditDB>) {
    await dropTriggers.execute(trx);

    await jsonbDiffFunction.execute(trx);
    await auditFunction.execute(trx);

    // Check if the UUIDv7 function exists (PG18+)
    const { rows: [uuidv7Exists] } = await checkIfUUIDv7Exists.execute(trx);
    if (!uuidv7Exists.exists) {
      await createUUIDv7Function.execute(trx);
    }

    await createTriggers.execute(trx);
  }

  async function getReferenceAuditTables(): Promise<Record<DatabaseType, string[]>> {
    const [foods, system] = await Promise.all(databaseTypes.map(db => availableTables(db).execute(kyselyDb[db])));

    return {
      foods: foods.rows.map(t => t.table),
      system: system.rows.map(t => t.table),
    };
  }

  async function getAuditTables(): Promise<AuditTablesResponse> {
    const [foods, system] = await Promise.all(databaseTypes.map(db =>
      (kyselyDb[db] as Kysely<AuditDB>).selectFrom('auditTables').select(['id', 'exclude']).orderBy('id').execute()));

    return { foods, system };
  }

  async function saveAuditTables(input: AuditTablesRequest): Promise<AuditTablesResponse> {
    const [foods, system] = await Promise.all(databaseTypes.map(db =>
      (kyselyDb[db] as Kysely<AuditDB>).contextTransaction(async (trx) => {
        const tables = input[db];
        let records: AuditTableAttributes[] = [];
        const deleteQuery = trx.deleteFrom('auditTables');

        if (tables.length) {
          await deleteQuery.where('id', 'not in', tables.map(t => t.id)).execute();

          records = await trx
            .insertInto('auditTables')
            .values(tables)
            .onConflict(oc => oc
              .column('id')
              .doUpdateSet({
                exclude: eb => eb.ref('excluded.exclude'),
                updatedAt: new Date(),
              }),
            )
            .returning(['id', 'exclude'])
            .execute();
        }
        else {
          await deleteQuery.execute();
        }

        await setup(trx);

        return records;
      })));

    return { foods, system };
  }

  async function buildTableMap(): Promise<TableMap> {
    const [foods, system] = await Promise.all([
      tableInfoSql.execute(kyselyDb.foods),
      tableInfoSql.execute(kyselyDb.system),
    ]);

    const buildInfo = (db: 'foods' | 'system') => (acc: TableMap, { table, links }: { table: string; links: AuditTableLinks[] }) => {
      if (!acc[table]) {
        acc[table] = {};
      }

      acc[table][db] = links;

      return acc;
    };

    let tableMap = foods.rows.reduce<TableMap>(buildInfo('foods'), {});

    // NOTE: overwrite (shared) foods tables with system tables if they exist in both databases
    tableMap = system.rows.reduce(buildInfo('system'), tableMap);

    return tableMap;
  }

  async function getTableMap(): Promise<TableMap> {
    return await cache.remember('audit', '1d', async () => await buildTableMap());
  }

  async function resolveResource(resource: string):
  Promise<['foods' | 'system', { kysely: Kysely<AuditDB>; table: string; links: AuditTableLinks[] }][] | undefined> {
    const tableMap = await getTableMap();
    const table = snakeCase(resource);
    const tableInfo = tableMap[table];
    if (!tableInfo)
      return undefined;

    return Object.entries(tableInfo)
      .map(([db, links]) => [db as 'foods' | 'system', { kysely: kyselyDb[db as 'foods' | 'system'], table, links }] as const);
  }

  async function mapWithUser(history: AuditLogAttributes[]): Promise<AuditEntry[]> {
    const userIds = history.reduce((acc, { ctxUserId }) => {
      if (ctxUserId)
        acc.add(ctxUserId);

      return acc;
    }, new Set<string>());

    const users = userIds.size > 0
      ? await kyselyDb.system
          .selectFrom('users')
          .select(['id', 'name'])
          .where('id', 'in', [...userIds])
          .execute()
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    return history.map(item => ({ ...item, user: item.ctxUserId ? userMap.get(item.ctxUserId) ?? null : null }));
  }

  function getLinkAuditLogSql(eb: ExpressionBuilder<AuditDB, 'auditLog'>, { table, fk, pk }: AuditTableLinks, value: string) {
    return eb
      .selectFrom('auditLog')
      .selectAll()
      .where('tableName', '=', table)
      .where(eb =>
        eb.or(
          [
            // One-to-one
            ...pk.map(col => sql<boolean>`record_id IN (SELECT ${sql.ref(col)}::text FROM ${sql.ref(table)} WHERE ${sql.ref(col)} = ${value})`),
            // One-to-many
            ...fk.map(col => sql<boolean>`record_id IN (SELECT ${sql.ref(col)}::text FROM ${sql.ref(table)} WHERE ${sql.ref(col)} = ${value})`),
            // Many-to-many
            ...fk.map(col => sql<boolean>`old_value->>${sql.lit(col)} = ${value}`),
            ...fk.map(col => sql<boolean>`new_value->>${sql.lit(col)} = ${value}`),
          ],
        ),
      );
  }

  async function getAuditLog(resource: string, id: string): Promise<AuditLog> {
    const res = await resolveResource(resource);
    if (!res)
      return { foods: [], system: [] };

    const queries = await Promise.all(res.map(async ([db, { kysely, table, links }]) => {
      let query = kysely
        .selectFrom('auditLog')
        .selectAll()
        .where('tableName', '=', snakeCase(table))
        .where('recordId', '=', id);

      if (links.length) {
        query = links.reduce((acc, link) => acc.unionAll(eb =>
          getLinkAuditLogSql(eb, link, id),
        ), query);
      }
      const history = await query.orderBy('id', 'desc').execute();
      return [db, await mapWithUser(history)];
    }));

    return Object.fromEntries(queries) as AuditLog;
  }

  return {
    getReferenceAuditTables,
    getAuditTables,
    saveAuditTables,
    getAuditLog,
    getTableMap,
  };
}

export default auditService;

export type AuditService = ReturnType<typeof auditService>;
