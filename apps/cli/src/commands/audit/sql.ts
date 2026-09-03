import { sql } from 'kysely';

import { CTX_ID, CTX_TYPE, CTX_USER_ID } from '@intake24/common-backend/acl';
import {
  AUDIT_EXCLUDE_TABLES,
  AUDIT_FUNCTION,
  AUDIT_SCHEMA,
  AUDIT_TABLE,
  AUDIT_TRIGGER,
} from '@intake24/common-backend/audit';

export function createTriggers(db: 'foods' | 'system') {
  return sql`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema = ${sql.lit(AUDIT_SCHEMA)}
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (${sql.join(AUDIT_EXCLUDE_TABLES[db].map(table => sql.lit(table)))})
      LOOP
        EXECUTE format('CREATE OR REPLACE TRIGGER ${sql.ref(AUDIT_TRIGGER)} AFTER INSERT OR UPDATE OR DELETE ON %I.%I
          FOR EACH ROW EXECUTE FUNCTION ${sql.ref(AUDIT_FUNCTION)}();', r.table_schema, r.table_name);
      END LOOP;
    END;
    $$;
  `;
}

export function dropTriggers() {
  return sql`
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
        EXECUTE format('DROP TRIGGER IF EXISTS ${sql.ref(AUDIT_TRIGGER)} ON %I.%I;', r.event_object_schema, r.event_object_table);
      END LOOP;
    END;
    $$;
  `;
}

export const jsonbSubtractFunction = sql`
  CREATE OR REPLACE FUNCTION ${sql.ref(AUDIT_SCHEMA)}.jsonb_subtract(old_value JSONB, new_value JSONB)
  RETURNS JSONB AS $$
    SELECT jsonb_object_agg(new_kv.key, new_kv.value)
    FROM jsonb_each(new_value) AS new_kv
    LEFT JOIN jsonb_each(old_value) AS old_kv
    ON new_kv.key = old_kv.key
    WHERE new_kv.value IS DISTINCT FROM old_kv.value;
  $$ LANGUAGE sql IMMUTABLE STRICT;
`;

export const auditFunction = sql`
  CREATE OR REPLACE FUNCTION ${sql.ref(AUDIT_SCHEMA)}.${sql.ref(AUDIT_FUNCTION)}()
  RETURNS TRIGGER AS $$
  DECLARE
    old_id text;
    new_id text;
    record_id text;
    ctx_type text;
    ctx_id uuid;
    ctx_user_id bigint;
    old_value jsonb;
    new_value jsonb;
    changed_fields jsonb;
  BEGIN
    ctx_type := nullif(current_setting(${sql.lit(CTX_TYPE)}, TRUE), '');
    ctx_id := nullif(current_setting(${sql.lit(CTX_ID)}, TRUE), '');
    ctx_user_id := nullif(current_setting(${sql.lit(CTX_USER_ID)}, TRUE), '');

    IF to_jsonb(NEW) ? 'id' THEN
      new_id := to_jsonb(NEW) ->> 'id';
    END IF;
    IF to_jsonb(OLD) ? 'id' THEN
      old_id := to_jsonb(OLD) ->> 'id';
    END IF;

    record_id := COALESCE(new_id, old_id)::text;

    IF (TG_OP = 'DELETE') THEN
      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, old_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, to_jsonb(OLD));
      RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
      old_value := to_jsonb(OLD);
      new_value := to_jsonb(NEW);
      changed_fields := jsonb_subtract(old_value, new_value);

      IF changed_fields IS NULL OR changed_fields = '{}'::jsonb THEN
        RETURN NEW;
      END IF;

      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, old_value, new_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, jsonb_subtract(new_value, old_value), changed_fields);
      RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, ctx_type, ctx_id, ctx_user_id, new_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, ctx_type, ctx_id, ctx_user_id, to_jsonb(NEW));
      RETURN NEW;

    END IF;

  END;
$$
LANGUAGE plpgsql SECURITY DEFINER;
`;

export const dropAuditTable = sql`DROP TABLE IF EXISTS ${sql.ref(AUDIT_TABLE)};`;

export const createAuditTable = sql`
  CREATE TABLE IF NOT EXISTS ${sql.ref(AUDIT_TABLE)} (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    table_name text NOT NULL,
    record_id text,
    operation text NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ctx_type text,
    ctx_id UUID,
    ctx_user_id BIGINT,
    old_value JSONB,
    new_value JSONB
  );
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_table_name_idx`)} ON ${sql.ref(AUDIT_TABLE)} (table_name);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_record_id_idx`)} ON ${sql.ref(AUDIT_TABLE)} (record_id);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_operation_idx`)} ON ${sql.ref(AUDIT_TABLE)} (operation);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_ctx_type_idx`)} ON ${sql.ref(AUDIT_TABLE)} (ctx_type);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_ctx_id_idx`)} ON ${sql.ref(AUDIT_TABLE)} (ctx_id);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_ctx_user_id_idx`)} ON ${sql.ref(AUDIT_TABLE)} (ctx_user_id);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_old_value_gin`)} ON ${sql.ref(AUDIT_TABLE)} USING gin (old_value jsonb_path_ops);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_new_value_gin`)} ON ${sql.ref(AUDIT_TABLE)} USING gin (new_value jsonb_path_ops);
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
