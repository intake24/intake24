import type { IoC } from '@intake24/api/ioc';
import type { TokenPayload } from '@intake24/common/security';

import { subDays } from 'date-fns';
import jwt from 'jsonwebtoken';

import { Op, PersonalAccessToken, RefreshToken } from '@intake24/db';

export const decode = (token: string): TokenPayload => jwt.decode(token) as TokenPayload;

function jwtRotationService(ops: Pick<IoC, 'logger'>) {
  const logger = ops.logger.child({ service: 'JwtRotationService' });

  /**
   * Store new refresh token to database
   *
   * @param {string} token
   * @param {string} userId
   * @returns {Promise<RefreshToken>}
   */
  const store = async (token: string, userId: string): Promise<RefreshToken> => {
    const { jti: id, exp } = decode(token);

    return RefreshToken.create({
      id,
      userId,
      revoked: false,
      expiresAt: new Date(exp * 1000),
    });
  };

  /**
   * Revoke refresh token by ID
   *
   * @param {string} token
   * @returns {Promise<number>}
   */
  const revoke = async (token: string): Promise<number> => {
    const { jti: id } = decode(token);

    const [rows] = await RefreshToken.update({ revoked: true }, { where: { id } });

    return rows;
  };

  /**
   * Revoke refresh tokens by userId
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  const revokeByUser = async (userId: string): Promise<number> => {
    const [rows] = await RefreshToken.update({ revoked: true }, { where: { userId } });

    return rows;
  };

  /**
   * Verify refresh token against database record
   *
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  const verify = async (token: string): Promise<boolean> => {
    const { jti } = decode(token);

    const refreshToken = await RefreshToken.findByPk(jti, {
      attributes: ['id', 'expiresAt', 'revoked'],
    });

    if (!refreshToken) {
      logger.debug('Refresh token not found.');
      return false;
    }

    if (refreshToken.revoked) {
      logger.debug('Refresh token revoked.');
      return false;
    }

    if (refreshToken.expiresAt <= new Date()) {
      logger.debug('Refresh token expired.');
      return false;
    }

    return true;
  };

  /**
   * 1) Verify refresh token against database record
   * 2) Revoke refresh token for rotation
   *
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  const verifyAndRevoke = async (token: string): Promise<boolean> => {
    const valid = await verify(token);
    await revoke(token);
    return valid;
  };

  /**
   * Clean expired refresh tokens
   *
   * @returns {Promise<number>}
   */
  const purgeRefreshTokens = async (): Promise<number> => {
    const rows = await RefreshToken.destroy({
      where: { expiresAt: { [Op.lte]: subDays(new Date(), 1) } },
    });
    logger.debug(`Expired refresh tokens (${rows}) have been purged.`);

    return rows;
  };

  /**
   * Clean expired personal access tokens
   *
   * @returns {Promise<number>}
   */
  const purgePersonalAccessTokens = async (): Promise<number> => {
    const rows = await PersonalAccessToken.destroy({
      where: { expiresAt: { [Op.lte]: subDays(new Date(), 1) } },
    });
    logger.debug(`Expired personal access tokens (${rows}) have been purged.`);

    return rows;
  };

  return {
    store,
    revoke,
    revokeByUser,
    verify,
    verifyAndRevoke,
    purgeRefreshTokens,
    purgePersonalAccessTokens,
  };
}

export default jwtRotationService;

export type JwtRotationService = ReturnType<typeof jwtRotationService>;
