import type { Request } from 'express';
import type { PassportStatic } from 'passport';
import type { StrategyOptionsWithRequest } from 'passport-jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import security from '@intake24/api/config/security';
import type { TokenPayload } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';

const { issuer, secret } = security.jwt;

export const opts: Record<FrontEnd, StrategyOptionsWithRequest> = {
  admin: {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
    issuer,
    audience: 'access',
    passReqToCallback: true,
  },
  survey: {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
    issuer,
    audience: 'access',
    passReqToCallback: true,
  },
};

export function buildJwtStrategy(frontEnd: FrontEnd): Strategy {
  return new Strategy(opts[frontEnd], async (req: Request, payload: TokenPayload, done) => {
    const { mfa } = req.scope.cradle.securityConfig;
    const { userId, jti, aud } = payload;

    if (!Array.isArray(aud)) {
      done(null, false);
      return;
    }

    if (!aud.includes('personal')) {
      req.aal = mfa.mode === 'optional' || payload.aal === 'aal2';
      done(null, payload);
      return;
    }

    try {
      const token = await req.scope.cradle.aclCache.getPersonalAccessToken(userId, jti);
      if (!token) {
        done(null, false);
        return;
      }

      req.aal = mfa.mode === 'optional' || payload.aal === 'aal2' || !!(mfa.compat && token.createdAt < mfa.compat);
      done(null, payload);
    }
    catch (err) {
      done(err, false);
    }
  });
}

export default (passport: PassportStatic): void => {
  passport.use('survey', buildJwtStrategy('survey'));
  passport.use('admin', buildJwtStrategy('admin'));
};
