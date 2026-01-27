import type { SignInLogAttributes } from '@intake24/common/types/http/admin';

import { initServer } from '@ts-rest/express';

import { NotFoundError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { SignInLog } from '@intake24/db';

export function signInLog() {
  return initServer().router(contract.admin.signInLog, {
    browse: {
      middleware: [permission('sign-in-logs', 'sign-in-logs:browse')],
      handler: async ({ query }) => {
        const signInLogs = await SignInLog.paginate<() => SignInLogAttributes>({
          query,
          columns: ['id', 'provider', 'providerKey'],
          order: [['id', 'DESC']],
        });

        return { status: 200, body: signInLogs };
      },
    },
    read: {
      middleware: [permission('sign-in-logs', 'sign-in-logs:read')],
      handler: async ({ params: { signInLogId } }) => {
        const signInLog = await SignInLog.findByPk(signInLogId);
        if (!signInLog)
          throw new NotFoundError();

        return { status: 200, body: signInLog };
      },
    },
    destroy: {
      middleware: [permission('sign-in-logs', 'sign-in-logs:delete')],
      handler: async ({ params: { signInLogId } }) => {
        const signInLog = await SignInLog.findByPk(signInLogId, { attributes: ['id'] });
        if (!signInLog)
          throw new NotFoundError();

        await signInLog.destroy();

        return { status: 204, body: undefined };
      },
    },
  });
}
