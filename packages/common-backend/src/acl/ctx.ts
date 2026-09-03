import { AsyncLocalStorage } from 'node:async_hooks';

export const CTX_LOCAL_USER_ID = 'app.user_id';

export type RequestContext = {
  userId: string | null;
};

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getContextUserId(): string | null {
  return requestContextStorage.getStore()?.userId ?? null;
}

type TransactionContext = {
  userId?: string | number | null;
  [key: string]: string | number | null | undefined;
};

export function getTransactionContext(context: TransactionContext) {
  const { userId, ...rest } = context;
  return { [CTX_LOCAL_USER_ID]: userId ?? getContextUserId(), ...rest };
}
