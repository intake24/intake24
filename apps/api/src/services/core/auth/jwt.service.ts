import type { Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt, { decode } from 'jsonwebtoken';

import { InternalServerError, NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { createAmrMethod } from '@intake24/common/security';
import type { AdminSignPayload, SignPayload, TokenPayload } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';
import { randomString } from '@intake24/common/util';
import { PersonalAccessToken } from '@intake24/db';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

function jwtService({
  jwtRotationService,
  securityConfig,
}: Pick<IoC, 'jwtRotationService' | 'securityConfig'>) {
  /**
   * Sign a token
   *
   * @param {(string | Buffer | object)} payload
   * @param {Secret} secret
   * @param {SignOptions} [options]
   * @returns {Promise<string>}
   */
  const sign = async (
    payload: object,
    secret: Secret,
    options: SignOptions = {},
  ): Promise<string> =>
    new Promise((resolve, reject) => {
      const jwtid = randomString(64);
      const { issuer } = securityConfig.jwt;

      jwt.sign(payload, secret, { jwtid, issuer, ...options }, (err, encoded) =>
        err || !encoded ? reject(err ?? new Error('Unable to sign token.')) : resolve(encoded));
    });

  /**
   * Verify token
   *
   * @param {string} token
   * @param {Secret} secret
   * @param {SignOptions} [options]
   * @returns {Promise<TokenPayload>}
   */
  const verify = async <T = TokenPayload>(
    token: string,
    secret: Secret,
    options: VerifyOptions = {},
  ): Promise<T> =>
    new Promise((resolve, reject) => {
      const { issuer } = securityConfig.jwt;

      jwt.verify(token, secret, { issuer, ...options }, (err, decoded) =>
        err || !decoded
          ? reject(err ?? new Error('Unable to verify refresh token.'))
          : resolve(decoded as T));
    });

  /**
   * Sign access token
   *
   * @param {SignPayload} payload
   * @param {FrontEnd} frontEnd
   * @param {SignOptions} [options]
   * @returns {Promise<string>}
   */
  const signAccessToken = async (
    payload: SignPayload,
    frontEnd: FrontEnd,
    options: SignOptions = {},
  ): Promise<string> => {
    const {
      secret,
      [frontEnd]: {
        access: { lifetime, audience },
      },
    } = securityConfig.jwt;

    if (!secret)
      throw new InternalServerError('No access token secret defined.');

    return sign(payload, secret, { audience, expiresIn: lifetime, ...options });
  };

  /**
   * Sign refresh token
   *
   * @param {SignPayload} payload
   * @param {FrontEnd} frontEnd
   * @param {SignOptions} [options]
   * @returns {Promise<string>}
   */
  const signRefreshToken = async (
    payload: SignPayload,
    frontEnd: FrontEnd,
    options: SignOptions = {},
  ): Promise<string> => {
    const { secret, lifetime, audience } = securityConfig.jwt[frontEnd].refresh;

    if (!secret)
      throw new InternalServerError('No refresh token secret defined.');

    return sign(payload, secret, { audience, expiresIn: lifetime, ...options });
  };

  /**
   * Verify validity of refresh token
   *
   * @param {string} token
   * @returns {TokenPayload}
   */
  const verifyRefreshToken = async (token: string, frontEnd: FrontEnd): Promise<TokenPayload> => {
    const { secret, audience } = securityConfig.jwt[frontEnd].refresh;
    if (!secret)
      throw new InternalServerError('No refresh token secret defined.');
    const options: VerifyOptions = {};
    if (typeof audience === 'string') {
      options.audience = audience;
    }
    else if (Array.isArray(audience) && audience.length > 0) {
      const [first, ...rest] = audience;
      options.audience = [first, ...rest] as [string | RegExp, ...(string | RegExp)[]];
    }
    return verify(token, secret, options);
  };

  /**
   * Decode token
   *
   * @param {string} token
   * @returns {TokenPayload}
   */
  const decodeToken = <T extends TokenPayload>(token: string): T => jwt.decode(token) as T;

  /**
   * Issue JWT tokens and log for rotation
   *
   * @param {SignPayload} payload
   * @param {FrontEnd} frontEnd
   * @param {SignOptions} [options]
   * @returns {Promise<Tokens>}
   */
  const issueTokens = async (
    payload: SignPayload,
    frontEnd: FrontEnd,
    options: SignOptions = {},
  ): Promise<Tokens> => {
    const { permissions, verified, ...refreshPayload } = payload;

    const aal = 'aal1';
    const amr = [createAmrMethod('pwd')];

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ aal, amr, ...payload }, frontEnd, options),
      signRefreshToken({ aal, amr, ...refreshPayload }, frontEnd, options),
    ]);

    await jwtRotationService.store(refreshToken, payload.userId);

    return { accessToken, refreshToken };
  };

  /**
   * Issue refresh token and log for rotation
   *
   * @param {SignPayload} payload
   * @param {FrontEnd} frontEnd
   * @param {SignOptions} [options]
   * @returns {Promise<string>}
   */
  const issueRefreshToken = async (
    payload: SignPayload,
    frontEnd: FrontEnd,
    options: SignOptions = {},
  ): Promise<string> => {
    const refreshToken = await signRefreshToken(payload, frontEnd, options);
    await jwtRotationService.store(refreshToken, payload.userId);

    return refreshToken;
  };

  const issuePersonalAccessToken = async (
    name: string,
    payload: AdminSignPayload,
    expiresAt: Date,
  ) => {
    const { userId } = payload;

    const jwt = await signAccessToken(payload, 'admin', {
      audience: ['access', 'admin', 'personal'],
      expiresIn: Math.trunc((expiresAt.getTime() - Date.now()) / 1000),
      subject: userId,
    });
    const { jti } = decode(jwt) as TokenPayload;

    const token = await PersonalAccessToken.create({ userId, name, token: jti, expiresAt });

    return { jwt, token };
  };

  const revokePersonalAccessToken = async (id: string, userId: string) => {
    const token = await PersonalAccessToken.findOne({ where: { id, userId } });
    if (!token)
      throw new NotFoundError();

    await token.update({ revoked: true });
  };

  return {
    sign,
    verify,
    signAccessToken,
    signRefreshToken,
    decodeToken,
    verifyRefreshToken,
    issueRefreshToken,
    issueTokens,
    issuePersonalAccessToken,
    revokePersonalAccessToken,
  };
}

export default jwtService;

export type JwtService = ReturnType<typeof jwtService>;
