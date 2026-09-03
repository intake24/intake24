import type { FoodsDB, SystemDB } from '../kysely';

import { sql } from 'kysely';

import { CTX_ID, CTX_TYPE, CTX_USER_ID } from '@intake24/common-backend/acl';
import {
  AUDIT_EXCLUDE_TABLES,
  AUDIT_FUNCTION,
  AUDIT_SCHEMA,
  AUDIT_TABLE,
  AUDIT_TRIGGER,
  JSONB_DIFF_FUNCTION,
} from '@intake24/common-backend/audit';

export type AuditDB = Pick<FoodsDB | SystemDB, 'auditLog' | 'auditTables'>;

export function availableTables(db: 'foods' | 'system') {
  return sql<{ table: string }>`
    SELECT table_name as table
    FROM information_schema.tables
    WHERE table_schema = ${sql.lit(AUDIT_SCHEMA)}
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN (${sql.join(AUDIT_EXCLUDE_TABLES[db].map(table => sql.lit(table)))})
    ORDER BY table_name;`;
}

export const createTriggers = sql`
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT
        cfg.id AS table_name,
        COALESCE(pk.column_name, 'id') AS pk_col,
        COALESCE(array_to_string(cfg.exclude, ','), '') AS exclude_str
      FROM audit_tables cfg
      LEFT JOIN (
        SELECT kcu.table_schema, kcu.table_name, MAX(kcu.column_name) AS column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          USING (table_schema, table_name, constraint_name)
        WHERE tc.constraint_type = 'PRIMARY KEY'
        GROUP BY kcu.table_schema, kcu.table_name
        HAVING COUNT(*) = 1
      ) pk ON pk.table_schema = ${sql.lit(AUDIT_SCHEMA)}
          AND pk.table_name = cfg.id
    LOOP
      EXECUTE format(
        'CREATE OR REPLACE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.%I(%L, %L)',
        ${sql.lit(AUDIT_TRIGGER)},
        ${sql.lit(AUDIT_SCHEMA)},
        r.table_name,
        ${sql.lit(AUDIT_SCHEMA)},
        ${sql.lit(AUDIT_FUNCTION)},
        r.pk_col,
        r.exclude_str
      );
    END LOOP;
  END $$;
`;

export const dropTriggers = sql`
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT DISTINCT event_object_schema, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = ${sql.lit(AUDIT_TRIGGER)}
      AND event_object_schema = ${sql.lit(AUDIT_SCHEMA)}
    LOOP
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON %I.%I;',
        ${sql.lit(AUDIT_TRIGGER)},
        r.event_object_schema,
        r.event_object_table
      );
    END LOOP;
  END;
  $$;
`;

export const jsonbDiffFunction = sql`
  DROP FUNCTION IF EXISTS ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(JSONB_DIFF_FUNCTION)};
  CREATE OR REPLACE FUNCTION ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(JSONB_DIFF_FUNCTION)}(
    source_val JSONB,
    target_val JSONB
  )
  RETURNS JSONB AS $$
    SELECT COALESCE(
      jsonb_object_agg(s.key, s.value),
      '{}'::jsonb
    )
    FROM jsonb_each(COALESCE(source_val, '{}'::jsonb)) AS s
    LEFT JOIN jsonb_each(COALESCE(target_val, '{}'::jsonb)) AS t
    ON s.key = t.key
    WHERE s.value IS DISTINCT FROM t.value;
  $$ LANGUAGE sql IMMUTABLE;
`;

export const auditFunction = sql`
  DROP FUNCTION IF EXISTS ${sql.id(AUDIT_SCHEMA)}.${sql.ref(AUDIT_FUNCTION)};
  CREATE OR REPLACE FUNCTION ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(AUDIT_FUNCTION)}()
  RETURNS TRIGGER AS $$
  DECLARE
    record_id text;
    ctx_type text;
    ctx_id uuid;
    ctx_user_id bigint;
    old_value jsonb;
    new_value jsonb;
    old_diff jsonb;
    new_diff jsonb;

    -- Dynamic arguments from trigger definition
    pk_col text := COALESCE(TG_ARGV[0], 'id');
    excluded_cols text[] := CASE
      WHEN TG_NARGS > 1 THEN string_to_array(TG_ARGV[1], ',')
      ELSE ARRAY[]::text[]
    END;

    target_json jsonb;
  BEGIN
    -- 1. Fetch Session Settings Safely
    BEGIN
      ctx_type := NULLIF(current_setting(${sql.lit(CTX_TYPE)}, TRUE), '');
      ctx_id := NULLIF(current_setting(${sql.lit(CTX_ID)}, TRUE), '')::uuid;
      ctx_user_id := NULLIF(current_setting(${sql.lit(CTX_USER_ID)}, TRUE), '')::bigint;
    EXCEPTION WHEN OTHERS THEN
      ctx_type := NULL; ctx_id := NULL; ctx_user_id := NULL;
    END;

    -- 2. Convert Tuples & Exclude Columns
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
      old_value := to_jsonb(OLD) - excluded_cols;
    END IF;

    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
      new_value := to_jsonb(NEW) - excluded_cols;
    END IF;

    -- 3. Extract Record ID
    target_json := COALESCE(new_value, old_value);

    -- Priority 1: Specified PK Column (defaults to 'id')
    record_id := target_json ->> pk_col;

    -- Priority 2: Fallback to 'id' if custom column wasn't found
    IF record_id IS NULL AND pk_col <> 'id' THEN
      record_id := target_json ->> 'id';
    END IF;

    -- Priority 3: Fallback to the first available key if no 'id' exists
    IF record_id IS NULL AND target_json IS NOT NULL THEN
      SELECT target_json ->> (jsonb_object_keys(target_json))
      INTO record_id
      LIMIT 1;
    END IF;

    -- 4. Audit Operations
    IF (TG_OP = 'DELETE') THEN
      INSERT INTO ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(AUDIT_TABLE)}
        (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, old_value)
      VALUES
        (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, old_value);
      RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
      old_diff := ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(JSONB_DIFF_FUNCTION)}(old_value, new_value);
      new_diff := ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(JSONB_DIFF_FUNCTION)}(new_value, old_value);

      -- Skip audit entry if no tracked values changed
      IF new_diff = '{}'::jsonb AND old_diff = '{}'::jsonb THEN
        RETURN NEW;
      END IF;

      INSERT INTO ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(AUDIT_TABLE)}
        (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, old_value, new_value)
      VALUES
        (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, old_diff, new_diff);
      RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(AUDIT_TABLE)}
        (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, new_value)
      VALUES
        (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, new_value);
      RETURN NEW;
    END IF;

    RETURN NULL;
  END;
$$
LANGUAGE plpgsql SECURITY DEFINER;
`;

export const checkIfUUIDv7Exists = sql<{ exists: boolean }>`
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'pg_catalog'
      AND p.proname = 'uuidv7'
  ) AS exists;
`;

/*
* UUIDv7 generation function based on
* https://gist.github.com/kjmph/5bd772b2c2df145aa645b837da7eca74
*/
export const createUUIDv7Function = sql`
  create or replace function uuidv7()
  returns uuid
  as $$
    -- use random v4 uuid as starting point (which has the same variant we need)
    -- then overlay timestamp
    -- then set version 7 by flipping the 2 and 1 bit in the version 4 string
  select encode(
      set_bit(
        set_bit(
          overlay(uuid_send(gen_random_uuid())
                  placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
                  from 1 for 6
          ),
          52, 1
        ),
        53, 1
      ),
      'hex')::uuid;
  $$
  language SQL
  volatile;
`;

export type AuditTableLinks = { table: string; fk: string[]; pk: string[] };

export const tableInfoSql = sql<{ table: string; links: AuditTableLinks[] }>`
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
