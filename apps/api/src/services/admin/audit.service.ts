import type { ExpressionBuilder, Kysely } from 'kysely';

import type { IoC } from '@intake24/api/ioc';
import type { DatabaseType } from '@intake24/common/types';
import type { AuditAttributes, AuditEntry, AuditHistory } from '@intake24/common/types/http/admin';
import type { FoodsDB, SystemDB } from '@intake24/db/kysely';

import { sql } from 'kysely';
import { snakeCase } from 'lodash-es';

import { AUDIT_SCHEMA, AUDIT_TRIGGER } from '@intake24/common-backend/audit';

type AuditDB = Pick<FoodsDB | SystemDB, 'auditLog'>;

type Link = { table: string; fk: string[]; pk: string[] };
type TableMap = Record<string, Partial<Record<DatabaseType, Link[]>>>;

const tableInfoSql = sql<{ table: string; links: Link[] }>`
  WITH table_pks AS (
      -- 1. Gather Primary Keys for all tables as JSON arrays
      SELECT
          con.conrelid AS table_oid,
          jsonb_agg(a.attname ORDER BY u.ord) AS pk_columns
      FROM pg_constraint con
      CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = u.attnum
      WHERE con.contype = 'p'
      GROUP BY con.conrelid
  ),
  table_fks AS (
      -- 2. Map FKs, collapsing multiple constraints/columns between two tables into ONE row
      SELECT
          con.confrelid AS referenced_table_oid,
          ref_table.relname AS referencing_table,
          -- array_agg(DISTINCT) ensures no duplicates if multiple constraints share a column
          to_jsonb(array_agg(DISTINCT a.attname)) AS referencing_columns,
          COALESCE(pk.pk_columns, '[]'::jsonb) AS referencing_pk
      FROM pg_constraint con
      JOIN pg_class ref_table ON ref_table.oid = con.conrelid
      CROSS JOIN LATERAL unnest(con.conkey) AS fk_attnum
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = fk_attnum
      LEFT JOIN table_pks pk ON pk.table_oid = con.conrelid
      WHERE con.contype = 'f'
      GROUP BY con.confrelid, ref_table.relname, pk.pk_columns
  )
  -- 3. Final aggregation mapping 1 table -> N related tables
  SELECT
      t.relname AS table,
      COALESCE(
          jsonb_agg(
              jsonb_build_object(
                  'table', fks.referencing_table,
                  'fk', fks.referencing_columns,
                  'pk', fks.referencing_pk
              )
          ) FILTER (WHERE fks.referencing_table IS NOT NULL),
          '[]'::jsonb
      ) AS links
  FROM pg_class t
  JOIN pg_namespace n ON n.oid = t.relnamespace
  LEFT JOIN table_fks fks ON fks.referenced_table_oid = t.oid
  WHERE t.relkind = 'r'
    AND t.relispartition = false
    AND n.nspname IN (${sql.lit(AUDIT_SCHEMA)})
    AND EXISTS (
        SELECT 1
        FROM pg_trigger trg
        WHERE trg.tgrelid = t.oid
          AND trg.tgname = ${sql.lit(AUDIT_TRIGGER)}
    )
  GROUP BY t.relname
  ORDER by t.relname
`;

function auditService({ cache, kyselyDb }: Pick<IoC, 'cache' | 'kyselyDb'>) {
  async function buildTableMap(): Promise<TableMap> {
    const [foods, system] = await Promise.all([
      tableInfoSql.execute(kyselyDb.foods),
      tableInfoSql.execute(kyselyDb.system),
    ]);

    const buildInfo = (db: 'foods' | 'system') => (acc: TableMap, { table, links }: { table: string; links: Link[] }) => {
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

  async function resolveResource(resource: string): Promise<['foods' | 'system', { kysely: Kysely<AuditDB>; table: string; links: Link[] }][]> {
    const tableMap = await getTableMap();
    const table = snakeCase(resource);
    const tableInfo = tableMap[table];
    if (!tableInfo)
      throw new Error(`Unknown resource: ${resource}`);

    return Object.entries(tableInfo)
      .map(([db, links]) => [db as 'foods' | 'system', { kysely: kyselyDb[db as 'foods' | 'system'], table, links }] as const);
  }

  async function mapWithUser(history: AuditAttributes[]): Promise<AuditEntry[]> {
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

  function getLinkAuditHistorySql(eb: ExpressionBuilder<AuditDB, 'auditLog'>, { table, fk, pk }: Link, value: string) {
    return eb
      .selectFrom('auditLog')
      .selectAll()
      .where('tableName', '=', table)
      .where(eb =>
        eb.or(
          [
            ...fk.map(col => sql<boolean>`old_value->>${sql.lit(col)} = ${value}`),
            ...fk.map(col => sql<boolean>`new_value->>${sql.lit(col)} = ${value}`),
            ...pk.map(col => sql<boolean>`record_id IN (SELECT id::text FROM ${sql.ref(table)} WHERE ${sql.ref(col)} = ${value})`),
          ],
        ),
      );
  }

  async function getAuditHistory(resource: string, id: string): Promise<AuditHistory> {
    const res = await resolveResource(resource);

    const queries = await Promise.all(res.map(async ([db, { kysely, table, links }]) => {
      let query = kysely
        .selectFrom('auditLog')
        .selectAll()
        .where('tableName', '=', snakeCase(table))
        .where('recordId', '=', id);

      if (links.length) {
        query = links.reduce((acc, link) => acc.unionAll(eb =>
          getLinkAuditHistorySql(eb, link, id),
        ), query);
      }
      const history = await query.orderBy('id', 'desc').execute();
      return [db, await mapWithUser(history)];
    }));

    return Object.fromEntries(queries) as AuditHistory;
  }

  return {
    getAuditHistory,
    getTableMap,
  };
}

export default auditService;

export type AuditService = ReturnType<typeof auditService>;
