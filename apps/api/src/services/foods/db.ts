import { Client } from 'pg';

export async function ensureEmbeddingColumn(client: Client, table: string, column: string, dim: number) {
  const checkRes = await client.query(
    `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type
     FROM pg_attribute a
     JOIN pg_class c ON a.attrelid = c.oid
     JOIN pg_namespace n ON c.relnamespace = n.oid
     WHERE c.relname = $1 AND a.attname = $2 AND a.attnum > 0 AND NOT a.attisdropped`,
    [table, column],
  );
  if (checkRes.rowCount === 0) {
    throw new Error(`Column ${column} vector(${dim}) on table ${table} is not present.`);
  }
  const type = checkRes.rows[0].type;
  const m = /^vector\((\d+)\)$/i.exec(type ?? '');
  if (!m) {
    throw new Error(`Column ${column} exists with incompatible type "${type}".`);
  }
  const existing = Number(m[1]);
  if (existing !== dim) {
    throw new Error(
      `Column ${column} has dimension ${existing} but model produces ${dim}. Drop/recreate the column or adjust EMBEDDING_MODEL.`,
    );
  }
  console.log(`Column ${column} already exists with vector(${existing}).`);
}
