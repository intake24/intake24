import type { Request } from 'express';
import { initServer } from '@ts-rest/express';
import { ipKeyGenerator } from 'express-rate-limit';
import { UnauthorizedError } from '@intake24/api/http/errors';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { attachRefreshToken } from './util';

export function authentication() {
  const loginRateLimiter = ioc.cradle.rateLimiter.createMiddleware('login', {
    keyGenerator: req => `login:${req.body?.email ?? ipKeyGenerator(req.ip ?? req.ips[0])}`,
    message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.login'),
    skipSuccessfulRequests: true,
  });

  return initServer().router(contract.public.authentication, {
    emailLogin: {
      middleware: [loginRateLimiter],
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.emailLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );
        return { status: 200, body: { accessToken: result.accessToken } };
      },
    },
    aliasLogin: {
      middleware: [loginRateLimiter],
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.aliasLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );
        return { status: 200, body: { accessToken: result.accessToken } };
      },
    },
    tokenLogin: {
      middleware: [loginRateLimiter],
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.tokenLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );

        return { status: 200, body: { accessToken: result.accessToken } };
      },
    },
    refresh: async ({ req, res }) => {
      const { name } = req.scope.cradle.securityConfig.jwt.survey.cookie;
      const refreshToken = req.cookies[name];
      if (!refreshToken)
        throw new UnauthorizedError();

      const tokens = await req.scope.cradle.authenticationService.refresh(refreshToken, 'survey');
      attachRefreshToken(
        tokens.refreshToken,
        res,
        req.scope.cradle.securityConfig.jwt.survey.cookie,
      );

      return { status: 200, body: { accessToken: tokens.accessToken } };
    },
    logout: async ({ req, res }) => {
      const { name, httpOnly, path, secure, sameSite }
        = req.scope.cradle.securityConfig.jwt.survey.cookie;

      const refreshToken = req.cookies[name];
      if (refreshToken)
        await req.scope.cradle.jwtRotationService.revoke(refreshToken);

      res.cookie(name, '', { maxAge: -1, httpOnly, path, secure, sameSite });

      return { status: 200, body: undefined };
    },
  });
}
