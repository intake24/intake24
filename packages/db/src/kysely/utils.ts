import type { SelectQueryBuilder, Simplify, StringReference } from 'kysely';
import { sql } from 'kysely';

import type { Pagination, PaginationMeta } from '@intake24/common/types/http';
import type { PaginateQuery } from '@intake24/db';

export async function executeWithPagination<DB, TB extends keyof DB, O>(query: SelectQueryBuilder<DB, TB, O>, searchColumns: StringReference<DB, TB>[], sortColumns: StringReference<DB, TB>[], paginateQuery: PaginateQuery): Promise<Pagination<Simplify<O>>> {
  const { page = 1, limit = 50, sort, search } = paginateQuery;

  const offset = limit * (page - 1);

  let modifiedQuery = query.offset(offset).limit(limit);

  if (search && typeof search === 'string' && searchColumns.length > 0) {
    modifiedQuery = modifiedQuery.where(eb =>
      eb.or(
        searchColumns.map(columnRef =>
          eb(sql`lower(cast(${sql.ref(columnRef)} as text))`, 'like', `%${search.toLowerCase()}%`),
        ),
      ),
    );
  }

  let sortColumn = sortColumns.at(0);
  let order: 'asc' | 'desc' = 'asc';
  if (sort && typeof sort === 'string') {
    const [sColumn, sOrder] = sort.split('|');
    sortColumn = sortColumns.find(refExpr => refExpr === sColumn);
    order = sOrder === 'desc' ? 'desc' : 'asc';
  }

  if (sortColumn !== undefined)
    modifiedQuery = modifiedQuery.orderBy(sortColumn, order);

  const countQuery = modifiedQuery
    .clearSelect()
    .clearLimit()
    .clearOffset()
    .clearOrderBy()
    .select(eb => eb.fn.countAll<string>().as('total'));

  const total = Number.parseInt(((await countQuery.executeTakeFirstOrThrow()) as { total: string }).total, 10);

  const data = await modifiedQuery.execute();

  const meta: PaginationMeta = {
    from: offset + 1,
    lastPage: Math.ceil(total / limit),
    page,
    path: '',
    limit,
    to: offset + limit,
    total,
  };

  return {
    data,
    meta,
  };
}

/**
 * Creates a SQL VALUES expression from an array of records and aliases it as a table-like expression.
 *
 * @typeParam R - The record shape (object with column names as keys) produced by each row.
 * @typeParam A - The alias string literal to assign to the generated VALUES expression.
 *
 * @param rows - Non-empty array of records to convert into a VALUES list. All records must share the same set of keys; the column order is derived from the first record's key iteration order.
 * @param alias - Alias to assign to the resulting VALUES expression; becomes the table name and is followed by the inferred column list.
 *
 * @returns A SQL fragment representing "(VALUES (...), (...)) AS <alias>(col1, col2, ...)", typed as R and aliased as A for use in query builders.
 *
 * @throws {Error} If `records` is empty.
 *
 * @example
 * const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * // Produces: (VALUES (1, 'Alice'), (2, 'Bob')) AS users(id, name)
 * const fragment = values(rows, 'users');
 */
export function values<R extends Record<string, unknown>, A extends string>(rows: R[], alias: A) {
  if (!rows.length)
    throw new Error('Records array must be non-empty');

  const columns = Object.keys(rows[0]);
  const valuesSql = sql.join(rows.map(row => sql`(${sql.join(columns.map(column => row[column]))})`));
  const aliasSql = sql`${sql.ref(alias)}(${sql.join(columns.map(sql.ref))})`;

  return sql<R>`(VALUES ${valuesSql})`.as<A>(aliasSql);
}
