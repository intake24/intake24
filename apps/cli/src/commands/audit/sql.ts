import { sql } from 'kysely';

import { CTX_LOCAL_USER_ID } from '@intake24/common-backend/acl';

import { AUDIT_FUNCTION, AUDIT_SCHEMA, AUDIT_TABLE, AUDIT_TRIGGER } from './constants';

export const createTriggers = sql`
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = ${sql.lit(AUDIT_SCHEMA)}
        AND table_type = 'BASE TABLE'
        AND table_name != ${sql.lit(AUDIT_TABLE)}
    LOOP
      EXECUTE format('CREATE OR REPLACE TRIGGER ${sql.ref(AUDIT_TRIGGER)} AFTER INSERT OR UPDATE OR DELETE ON %I.%I
        FOR EACH ROW EXECUTE FUNCTION ${sql.ref(AUDIT_FUNCTION)}();', r.table_schema, r.table_name);
    END LOOP;
  END;
  $$;
`;

export const dropTriggers = sql`
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = ${sql.lit(AUDIT_SCHEMA)}
        AND table_type = 'BASE TABLE'
        AND table_name != ${sql.lit(AUDIT_TABLE)}
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS ${sql.ref(AUDIT_TRIGGER)} ON %I.%I;', r.table_schema, r.table_name);
    END LOOP;
  END;
  $$;
`;

export const jsonbSubtractFunction = sql`
  CREATE OR REPLACE FUNCTION jsonb_subtract(old_value JSONB, new_value JSONB)
  RETURNS JSONB AS $$
    SELECT jsonb_object_agg(new_kv.key, new_kv.value)
    FROM jsonb_each(new_value) AS new_kv
    LEFT JOIN jsonb_each(old_value) AS old_kv
    ON new_kv.key = old_kv.key
    WHERE new_kv.value IS DISTINCT FROM old_kv.value;
  $$ LANGUAGE sql IMMUTABLE STRICT;
`;

export const auditFunction = sql`
  CREATE OR REPLACE FUNCTION ${sql.ref(AUDIT_FUNCTION)}()
  RETURNS TRIGGER AS $$
  DECLARE
    old_id text;
    new_id text;
    record_id text;
    user_id bigint;
    old_value jsonb;
    new_value jsonb;
    changed_fields jsonb;
  BEGIN
    user_id := nullif(current_setting(${sql.lit(CTX_LOCAL_USER_ID)}, TRUE), '');

    IF to_jsonb(NEW) ? 'id' THEN
      new_id := to_jsonb(NEW) ->> 'id';
    END IF;
    IF to_jsonb(OLD) ? 'id' THEN
      old_id := to_jsonb(OLD) ->> 'id';
    END IF;

    record_id := COALESCE(new_id, old_id)::text;

    IF (TG_OP = 'DELETE') THEN
      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, changed_by, old_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, user_id, to_jsonb(OLD));
      RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
      old_value := to_jsonb(OLD);
      new_value := to_jsonb(NEW);
      changed_fields := jsonb_subtract(old_value, new_value);

      IF changed_fields IS NULL OR changed_fields = '{}'::jsonb THEN
        RETURN NEW;
      END IF;

      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, changed_by, old_value, new_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, user_id, jsonb_subtract(new_value, old_value), changed_fields);
      RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO ${sql.ref(AUDIT_TABLE)} (table_name, record_id, operation, changed_by, new_value)
      VALUES (TG_TABLE_NAME, record_id, TG_OP, user_id, to_jsonb(NEW));
      RETURN NEW;

    END IF;

  END;
$$
LANGUAGE plpgsql SECURITY DEFINER;
`;

export const createAuditTable = sql`
  DROP TABLE IF EXISTS ${sql.ref(AUDIT_TABLE)};
  CREATE TABLE ${sql.ref(AUDIT_TABLE)} (
    id BIGSERIAL PRIMARY KEY,
    table_name text NOT NULL,
    record_id text,
    operation text NOT NULL,
    changed_by BIGINT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    old_value JSONB,
    new_value JSONB
  );
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_table_name_idx`)} ON ${sql.ref(AUDIT_TABLE)} (table_name);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_record_id_idx`)} ON ${sql.ref(AUDIT_TABLE)} (record_id);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_operation_idx`)} ON ${sql.ref(AUDIT_TABLE)} (operation);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_changed_by_idx`)} ON ${sql.ref(AUDIT_TABLE)} (changed_by);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_old_value_gin`)} ON ${sql.ref(AUDIT_TABLE)} USING gin (old_value jsonb_path_ops);
  CREATE INDEX ${sql.ref(`${AUDIT_TABLE}_new_value_gin`)} ON ${sql.ref(AUDIT_TABLE)} USING gin (new_value jsonb_path_ops);
`;
