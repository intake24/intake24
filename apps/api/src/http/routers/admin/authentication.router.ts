import type { Request } from 'express';
import { initServer } from '@ts-rest/express';
import { ipKeyGenerator } from 'express-rate-limit';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { UnauthorizedError } from '../../errors';
import { attachRefreshToken } from '../util';

export function authentication() {
  const loginRateLimiter = ioc.cradle.rateLimiter.createMiddleware('login', {
    keyGenerator: req => `login:${req.body?.email ?? ipKeyGenerator(req.ip ?? req.ips[0])}`,
    message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.login'),
    skipSuccessfulRequests: true,
  });

  return initServer().router(contract.admin.authentication, {
    login: {
      middleware: [loginRateLimiter],
      handler: async ({ body, req, res }) => {
        const result = await req.scope.cradle.authenticationService.adminLogin(
          body,
          { req },
        );
        if ('devices' in result)
          return { status: 200, body: result };

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.admin.cookie,
        );

        return { status: 200, body: { accessToken: result.accessToken } };
      },
    },
    duo: async ({ body, req, res }) => {
      const { token } = body;

      const tokens = await req.scope.cradle.authenticationService.verify(
        { provider: 'duo', token },
        { req },
      );

      attachRefreshToken(
        tokens.refreshToken,
        res,
        req.scope.cradle.securityConfig.jwt.admin.cookie,
      );

      return { status: 200, body: { accessToken: tokens.accessToken } };
    },
    fido: async ({ body, req, res }) => {
      const { response } = body;

      const tokens = await req.scope.cradle.authenticationService.verify(
        { provider: 'fido', response },
        { req },
      );

      attachRefreshToken(
        tokens.refreshToken,
        res,
        req.scope.cradle.securityConfig.jwt.admin.cookie,
      );

      return { status: 200, body: { accessToken: tokens.accessToken } };
    },
    otp: async ({ body, req, res }) => {
      const { token } = body;

      const tokens = await req.scope.cradle.authenticationService.verify(
        { provider: 'otp', token },
        { req },
      );

      attachRefreshToken(
        tokens.refreshToken,
        res,
        req.scope.cradle.securityConfig.jwt.admin.cookie,
      );

      return { status: 200, body: { accessToken: tokens.accessToken } };
    },
    refresh: async ({ req, res }) => {
      const { name } = ioc.cradle.securityConfig.jwt.admin.cookie;
      const refreshToken = req.cookies[name];
      if (!refreshToken)
        throw new UnauthorizedError();

      const tokens = await req.scope.cradle.authenticationService.refresh(refreshToken, 'admin');
      attachRefreshToken(
        tokens.refreshToken,
        res,
        req.scope.cradle.securityConfig.jwt.admin.cookie,
      );

      return { status: 200, body: { accessToken: tokens.accessToken } };
    },
    logout: async ({ req, res }) => {
      const { name, httpOnly, path, secure, sameSite } = ioc.cradle.securityConfig.jwt.admin.cookie;

      const refreshToken = req.cookies[name];
      if (refreshToken)
        await req.scope.cradle.jwtRotationService.revoke(refreshToken);

      res.cookie(name, '', { maxAge: -1, httpOnly, path, secure, sameSite }).json();

      return { status: 200, body: undefined };
    },
  });
}
