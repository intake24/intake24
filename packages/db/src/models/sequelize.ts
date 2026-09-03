import { Transaction } from 'sequelize';
import { Sequelize as Base } from 'sequelize-typescript';

import { getTransactionContext } from '@intake24/common-backend';

type TransactionContext = {
  userId?: string | number | null;
  [key: string]: string | number | null | undefined;
};

export class Sequelize extends Base {
  async contextTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
    context: TransactionContext = {},
  ): Promise<T> {
    return await this.transaction(async (transaction) => {
      const ctx = getTransactionContext(context);
      for (const [key, value] of Object.entries(ctx)) {
        await this.query('SELECT set_config(:key, :value, true)', { replacements: { key, value }, transaction });
      }
      return await callback(transaction);
    });
  }
}
