import { initServer } from '@ts-rest/express';

import { ValidationError } from '@intake24/api/http/errors';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { User } from '@intake24/db';

import { captchaCheck } from '../../rules';
import { attachRefreshToken } from '../util';

async function uniqueMiddleware(value: any) {
  if (!(await unique({ model: User, condition: { field: 'email', value } }))) {
    throw ValidationError.from({ path: 'email', i18n: { type: 'unique._' } });
  }
}

export function signUp() {
  return initServer().router(contract.admin.signUp, {
    signUp: async ({ req, res }) => {
      const {
        body: { name, email, phone, password, captcha },
        headers: { 'user-agent': userAgent },
      } = req;

      await captchaCheck(captcha, ioc.cradle.servicesConfig.captcha);
      await uniqueMiddleware(email);

      await req.scope.cradle.adminSignupService.signUp(
        { name, email, phone, password },
        { notify: true, userAgent },
      );

      const result = await req.scope.cradle.authenticationService.adminLogin(
        { email, password },
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
    verify: async ({ body, req }) => {
      const { token } = body;

      await req.scope.cradle.adminSignupService.verify(token);

      return { status: 200, body: undefined };
    },
  });
}
