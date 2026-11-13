import { initServer } from '@ts-rest/express';

import { UnauthorizedError } from '@intake24/api/http/errors';
import { aliasAccountKey, emailAccountKey, loginRateLimiting } from '@intake24/api/http/rate-limit';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';

import { attachRefreshToken } from './util';

export function authentication() {
  const loginRateLimit = loginRateLimiting('survey', ioc.cradle);

  return initServer().router(contract.public.authentication, {
    emailLogin: {
      middleware: loginRateLimit.middleware(req => emailAccountKey(req.body?.email)),
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.emailLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        loginRateLimit.issueDeviceCookie(req, res, emailAccountKey(body.email));

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );
        return {
          status: 200,
          body: { accessToken: result.accessToken },
        };
      },
    },
    aliasLogin: {
      middleware: loginRateLimit.middleware(req => aliasAccountKey(req.body?.survey, req.body?.username)),
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.aliasLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        loginRateLimit.issueDeviceCookie(req, res, aliasAccountKey(body.survey, body.username));

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );
        return {
          status: 200,
          body: { accessToken: result.accessToken },
        };
      },
    },
    tokenLogin: {
      middleware: loginRateLimit.middleware(),
      handler: async ({ body, headers: { 'user-agent': userAgent }, req, res }) => {
        const result = await req.scope.cradle.authenticationService.tokenLogin(body, { req, userAgent });
        if ('provider' in result)
          return { status: 200, body: result };

        attachRefreshToken(
          result.refreshToken,
          res,
          req.scope.cradle.securityConfig.jwt.survey.cookie,
        );

        return {
          status: 200,
          body: { accessToken: result.accessToken },
        };
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

      return {
        status: 200,
        body: { accessToken: tokens.accessToken },
      };
    },
    logout: async ({ req, res }) => {
      const { name, httpOnly, path, secure, sameSite }
        = req.scope.cradle.securityConfig.jwt.survey.cookie;

      const refreshToken = req.cookies[name];
      if (refreshToken)
        await req.scope.cradle.jwtRotationService.revoke(refreshToken);

      res.cookie(name, '', {
        maxAge: -1,
        httpOnly,
        path,
        secure,
        sameSite,
      });

      return { status: 200, body: undefined };
    },
  });
}
