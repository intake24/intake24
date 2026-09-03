import { AsyncLocalStorage } from 'node:async_hooks';

import { snakeCase } from 'lodash-es';

export const CTX_TYPE = 'ctx.type';
export const CTX_ID = 'ctx.id';
export const CTX_USER_ID = 'ctx.user_id';

export type RequestContext = {
  type?: 'request' | 'job' | null;
  id?: string | null;
  userId?: string | null;
};

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  return requestContextStorage.getStore() ?? {};
}

export type TransactionContext = RequestContext & {
  [key: string]: string | number | null | undefined;
};

export function getTransactionContext(context: TransactionContext = {}) {
  return Object.entries({ ...getContext(), ...context }).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[`ctx.${snakeCase(key)}`] = String(value);
    }
    return acc;
  }, {});
}
