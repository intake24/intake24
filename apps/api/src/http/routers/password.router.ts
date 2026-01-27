import type { Request } from 'express';

import { initServer } from '@ts-rest/express';
import ms from 'ms';

import { ValidationError } from '@intake24/api/http/errors';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { Op, UserPasswordReset } from '@intake24/db';

import { captchaCheck } from '../rules';

export function password() {
  return initServer().router(contract.public.password, {
    request: {
      middleware: [
        ioc.cradle.rateLimiter.createMiddleware('password', {
          message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.password'),
          skipFailedRequests: true,
        }),
      ],
      handler: async ({ req }) => {
        const {
          body: { email, captcha },
          headers: { 'user-agent': userAgent },
        } = req;
        await captchaCheck(captcha, ioc.cradle.servicesConfig.captcha);

        await req.scope.cradle.scheduler.jobs.addJob({
          type: 'UserPasswordResetNotification',
          params: { email, userAgent },
        });

        return { status: 200, body: undefined };
      },
    },
    reset: async ({ body, req }) => {
      const { email, password, token } = body;

      const expiredAt = new Date(
        Date.now() - ms(req.scope.cradle.securityConfig.passwords.expiresIn),
      );

      const passwordReset = await UserPasswordReset.findOne({
        attributes: ['id', 'userId'],
        where: { token, createdAt: { [Op.gt]: expiredAt } },
        include: [{ association: 'user', where: { email: { [UserPasswordReset.op('ciEq')]: email } } }],
      });

      if (!passwordReset) {
        throw new ValidationError(
          `It looks like this link is invalid / expired. Please check your email or request another link.`,
          { path: 'token' },
        );
      }

      const { userId } = passwordReset;

      await Promise.all([
        req.scope.cradle.adminUserService.updatePassword(userId, password),
        passwordReset.destroy(),
      ]);

      return { status: 200, body: undefined };
    },
  });
}
