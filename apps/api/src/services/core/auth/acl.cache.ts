import type { IoC } from '@intake24/api/ioc';
import type { Permission, Role } from '@intake24/db';

import { Op } from 'sequelize';

import { ACL_PAT_KEY, ACL_PERMISSIONS_KEY, ACL_ROLES_KEY } from '@intake24/common/security';
import { PersonalAccessToken, User } from '@intake24/db';

function aclCache({ aclConfig, cache }: Pick<IoC, 'aclConfig' | 'cache'>) {
  const { enabled, ttl } = aclConfig.cache;

  /**
   * Fetch user's permissions from database
   *
   * @param {string} userId
   * @returns {Promise<Permission[]>}
   */
  const fetchPermissions = async (userId: string): Promise<Permission[]> => {
    const user = await User.scope(['permissions', 'rolesPerms']).findByPk(userId);
    if (!user)
      return [];

    return user.allPermissions();
  };

  /**
   * Fetch user's roles from database
   *
   * @param {string} userId
   * @returns {Promise<Role[]>}
   */
  const fetchRoles = async (userId: string): Promise<Role[]> => {
    const user = await User.scope('roles').findByPk(userId);
    if (!user)
      return [];

    return user.allRoles();
  };

  /**
   * Get user's permissions
   * - tries to fetch cached data if available and enabled
   * - then fetches data from database
   *
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  const getPermissions = async (userId: string): Promise<string[]> => {
    if (!enabled)
      return (await fetchPermissions(userId)).map(({ name }) => name);

    const permissions = await cache.remember<Permission[]>(
      `${ACL_PERMISSIONS_KEY}:${userId}`,
      ttl,
      () => fetchPermissions(userId),
    );

    return permissions.map(({ name }) => name);
  };

  /**
   * Get user's roles
   * - tries to fetch cached data if available and enabled
   * - then fetches data from database
   *
   * @returns {Promise<string[]>}
   */
  const getRoles = async (userId: string): Promise<string[]> => {
    if (!enabled)
      return (await fetchRoles(userId)).map(({ name }) => name);

    const roles = await cache.remember<Role[]>(`${ACL_ROLES_KEY}:${userId}`, ttl, () =>
      fetchRoles(userId));

    return roles.map(({ name }) => name);
  };

  /**
   * Get personal access token by token id for authentication
   *
   * @param {string} userId
   * @param {string} token
   * @returns {(Promise<PersonalAccessToken | null>)}
   */
  const getPersonalAccessToken = async (userId: string, token: string): Promise<PersonalAccessToken | null> => {
    return await cache.remember<PersonalAccessToken | null>(`${ACL_PAT_KEY}:${token}`, ttl, async () =>
      PersonalAccessToken.findOne({
        attributes: ['id', 'token', 'userId', 'createdAt'],
        where: {
          userId,
          token,
          revoked: false,
          expiresAt: { [Op.gt]: new Date() },
        },
        include: [
          {
            association: 'user',
            attributes: [],
            required: true,
            where: { disabledAt: null, verifiedAt: { [Op.ne]: null } },
          },
        ],
      }));
  };

  return {
    getPermissions,
    getPersonalAccessToken,
    getRoles,
  };
}

export default aclCache;

export type ACLCache = ReturnType<typeof aclCache>;
