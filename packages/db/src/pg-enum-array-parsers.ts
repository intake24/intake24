import type { Pool } from 'pg';
import type { Sequelize } from 'sequelize';

import type { DatabaseType } from '.';

import { types } from 'pg';
import pgArray from 'postgres-array';
import { QueryTypes } from 'sequelize';

/**
 * These functions set up custom type parsers for PostgreSQL enum arrays.
 *
 * This is needed because node-postgres doesn't automatically parse enum arrays
 * (they come back as strings like {value1,value2} instead of actual arrays).
 *
 * See https://github.com/brianc/node-pg-types/issues/56
 *
 * Database has to be queried to set up these parsers since type IDs (OIDs)
 * are database-instance specific and need to be discovered at runtime.
 */

export const ENUM_ARRAY_TYPES: Record<DatabaseType, string[]>
  = {
    foods: [
      'enum_category_portion_size_methods_pathways',
      'enum_food_portion_size_methods_pathways',
    ],
    system: [],
  };

function registerParsers(rows: { typname: string; typarray: number }[]): void {
  if (rows.length === 0) {
    console.warn('Expected enum array types not found in the database. Check if migrations are out of date.');
    return;
  }

  for (const row of rows) {
    types.setTypeParser(row.typarray, (val: string | null) => {
      if (!val)
        return null;
      return pgArray.parse(val);
    });
  }
}

export async function setupEnumArrayParsers(pool: Pool, enumNames: string[]): Promise<void> {
  if (enumNames.length === 0) {
    return;
  }

  const client = await pool.connect();

  try {
    const result = await client.query<{ typname: string; typarray: number }>(`
      SELECT typname, typarray
      FROM pg_type
      WHERE typname = ANY($1)
        AND typarray != 0
    `, [enumNames]);

    registerParsers(result.rows);
  }
  finally {
    client.release();
  }
}

export async function setupEnumArrayParsersSequelize(sequelize: Sequelize, enumNames: string[]): Promise<void> {
  if (enumNames.length === 0) {
    return;
  }

  const results = await sequelize.query<{ typname: string; typarray: number }>(`
      SELECT typname, typarray
      FROM pg_type
      WHERE typname = ANY(ARRAY[:enumNames])
        AND typarray != 0
    `, {
    replacements: { enumNames },
    type: QueryTypes.SELECT,
  });

  registerParsers(results ?? []);
}
