import type { Request } from 'express';

import { initServer } from '@ts-rest/express';

import { NotFoundError } from '@intake24/api/http/errors';
import ioc from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import { contract } from '@intake24/common/contracts';
import { User } from '@intake24/db';

export function profile() {
  const verifyRateLimiter = ioc.cradle.rateLimiter.createMiddleware('verify', {
    message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.verify'),
    skipFailedRequests: true,
  });

  return initServer().router(contract.admin.user.profile, {
    profile: async ({ req }) => {
      const {
        aclService,
        user: { userId },
      } = req.scope.cradle;

      const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'phone', 'multiFactorAuthentication'] });
      if (!user)
        throw new NotFoundError();

      const { id, name, email, phone, multiFactorAuthentication: mfa } = user;
      const [permissions, roles] = await Promise.all([
        aclService.getPermissions(),
        aclService.getRoles(),
      ]);

      return {
        status: 200,
        body: {
          profile: { id, name, email: email as string, phone, mfa },
          aal: !!req.aal,
          permissions,
          roles,
        },
      };
    },
    update: async ({ body: { name, phone }, req }) => {
      const { user: { userId } } = req.scope.cradle;

      const user = await User.findByPk(userId, { attributes: ['id', 'name', 'phone'] });
      if (!user)
        throw new NotFoundError();

      await user.update({ name, simpleName: toSimpleName(name), phone });

      return { status: 200, body: undefined };
    },
    verify: {
      middleware: [verifyRateLimiter],
      handler: async ({ req, headers: { 'user-agent': userAgent } }) => {
        const { userId } = req.scope.cradle.user;

        const user = await User.findByPk(userId, { attributes: ['id', 'email', 'verifiedAt'] });

        if (!user?.email || user.isVerified())
          return { status: 200, body: undefined };

        await req.scope.cradle.scheduler.jobs.addJob({
          type: 'UserEmailVerificationNotification',
          params: { email: user.email, userAgent },
        });

        return { status: 200, body: undefined };
      },
    },
  });
}
