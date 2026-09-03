import type { Transaction } from 'kysely';

import { Kysely as Base, sql } from 'kysely';

import { getTransactionContext } from '@intake24/common-backend';

type TransactionContext = {
  userId?: string | number | null;
  [key: string]: string | number | null | undefined;
};

export async function executeContextTransaction<DB, T>(
  db: Kysely<DB>,
  callback: (transaction: Transaction<DB>) => Promise<T>,
  context: TransactionContext = {},
): Promise<T> {
  return await db.transaction().execute(async (transaction) => {
    const ctx = getTransactionContext(context);
    for (const [key, value] of Object.entries(ctx)) {
      await sql<string>`SELECT set_config(${key}, ${value}, true)`.execute(transaction);
    }

    return await callback(transaction);
  });
}

export class Kysely<DB> extends Base<DB> {
  async contextTransaction<T>(
    callback: (transaction: Transaction<DB>) => Promise<T>,
    context: TransactionContext = {},
  ): Promise<T> {
    return await this.transaction().execute(async (transaction) => {
      const ctx = getTransactionContext(context);
      for (const [key, value] of Object.entries(ctx)) {
        await sql<string>`SELECT set_config(${key}, ${value}, true)`.execute(transaction);
      }
      return await callback(transaction);
    });
  }
}
