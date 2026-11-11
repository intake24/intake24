import type { Transaction } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';
import type { UserCustomField as UserCustomFieldInput } from '@intake24/common/types';
import type { UserInput } from '@intake24/common/types/http/admin';
import type { UserPasswordAttributes } from '@intake24/db';

import { uniqBy, xor } from 'lodash-es';
import { Op } from 'sequelize';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { toSimpleName } from '@intake24/api/util';
import { defaultAlgorithm } from '@intake24/common-backend';
import { ACL_PAT_KEY, ACL_PERMISSIONS_KEY, ACL_ROLES_KEY, globalSupport } from '@intake24/common/security';
import { randomString } from '@intake24/common/util';
import { Permission, PersonalAccessToken, RoleUser, User, UserCustomField, UserPassword } from '@intake24/db';

export type UserPasswordInput = {
  userId: string;
  password: string;
};

export type CreateUserOptions = {
  notify?: boolean;
  userAgent?: string;
};

function adminUserService({
  aclConfig,
  cache,
  commsService,
  db,
  jwtRotationService,
  scheduler,
}: Pick<IoC, 'aclConfig' | 'cache' | 'commsService' | 'db' | 'jwtRotationService' | 'scheduler'>) {
  const flushACLCacheByUserId = async (userId: string): Promise<void> => {
    await cache.forget([`${ACL_PERMISSIONS_KEY}:${userId}`, `${ACL_ROLES_KEY}:${userId}`]);
  };

  const flushACLCache = async (): Promise<void> => {
    await Promise.all([
      cache.flush(`${ACL_PERMISSIONS_KEY}:*`),
      cache.flush(`${ACL_ROLES_KEY}:*`),
    ]);
  };

  const flushPATCache = async (userId: string): Promise<void> => {
    const tokens = await PersonalAccessToken.findAll({
      attributes: ['token'],
      where: { userId },
    });
    if (!tokens.length)
      return;

    await cache.forget(tokens.map(({ token }) => `${ACL_PAT_KEY}:${token}` as const));
  };

  /**
   * Flush user ACL cache by role ID
   *
   * @param {string} roleId
   * @returns {Promise<void>}
   */
  const flushACLCacheByRoleId = async (roleId: string): Promise<void> => {
    const roleUsers = await RoleUser.findAll({
      where: { roleId },
    });

    await Promise.all(roleUsers.map(({ userId }) => flushACLCacheByUserId(userId)));
  };

  /**
   * Flush user ACL cache by role name
   *
   * @param {string} name
   * @returns {Promise<void>}
   */
  const flushACLCacheByRoleName = async (name: string): Promise<void> => {
    const roleUsers = await RoleUser.findAll({
      include: [
        {
          association: 'role',
          where: { name },
          required: true,
        },
      ],
    });

    await Promise.all(roleUsers.map(({ userId }) => flushACLCacheByUserId(userId)));
  };

  /**
   * Flush superuser ACL cache
   *
   * @returns {Promise<void>}
   */
  const flushSuperuserACLCache = async (): Promise<void> =>
    flushACLCacheByRoleName(aclConfig.roles.superuser);

  const assertPermissionNamesHeld = (callerPermissions: string[], names: string[]): void => {
    if (names.some(name => !callerPermissions.includes(name)))
      throw new ForbiddenError('Insufficient permissions to manage this access.');
  };

  const assertPermissionsHeld = async (callerPermissions: string[], permissionIds: string[]): Promise<void> => {
    const permissions = await Permission.findAll({
      attributes: ['name'],
      where: { id: permissionIds },
    });

    assertPermissionNamesHeld(callerPermissions, permissions.map(({ name }) => name));
  };

  const assertRolesHeld = async (callerPermissions: string[], roleIds: string[]): Promise<void> => {
    const permissions = await Permission.findAll({
      attributes: ['name'],
      include: [
        {
          association: 'roleLinks',
          attributes: [],
          where: { roleId: roleIds },
        },
      ],
    });

    assertPermissionNamesHeld(callerPermissions, permissions.map(({ name }) => name));
  };

  /**
   * Caller may only manage users whose effective permissions they fully hold (null userId = new user),
   * and may only grant or revoke permissions/roles they fully hold.
   */
  const assertCanManageUser = async (
    callerPermissions: string[],
    userId: string | null,
    { permissions, roles }: Pick<UserInput, 'permissions' | 'roles'> = {},
  ): Promise<void> => {
    let currentPermissionIds: string[] = [];
    let currentRoleIds: string[] = [];

    if (userId) {
      const user = await User.scope(['permissions', 'rolesPerms']).findByPk(userId);
      if (!user)
        throw new NotFoundError();

      const userPermissions = user.permissions!;
      const userRoles = user.roles!;

      assertPermissionNamesHeld(
        callerPermissions,
        [
          ...userPermissions,
          ...userRoles.flatMap(role => role.permissions!),
        ].map(({ name }) => name),
      );

      currentPermissionIds = userPermissions.map(({ id }) => id);
      currentRoleIds = userRoles.map(({ id }) => id);
    }

    if (permissions)
      await assertPermissionsHeld(callerPermissions, xor(currentPermissionIds, permissions));

    if (roles)
      await assertRolesHeld(callerPermissions, xor(currentRoleIds, roles));
  };

  /**
   * Create password record
   *
   * @param {UserPasswordInput} { userId, password }
   * @param {Transaction} [transaction]
   * @returns {Promise<UserPassword>}
   */
  const createPassword = async (
    { userId, password }: UserPasswordInput,
    transaction?: Transaction,
  ): Promise<UserPassword> => {
    const { hash, salt } = await defaultAlgorithm.hash(password);

    return UserPassword.create(
      {
        userId,
        hash,
        salt,
        hasher: defaultAlgorithm.id,
      },
      { transaction },
    );
  };

  /**
   * Bulk-create password records
   *
   * @param {UserPasswordInput[]} inputs
   * @param {Transaction} [transaction]
   * @returns {Promise<UserPassword[]>}
   */
  const createPasswords = async (
    inputs: UserPasswordInput[],
    transaction?: Transaction,
  ): Promise<UserPassword[]> => {
    const records: UserPasswordAttributes[] = [];

    for (const input of inputs) {
      const { userId, password } = input;
      const { hash, salt } = await defaultAlgorithm.hash(password);

      records.push({
        userId,
        hash,
        salt,
        hasher: defaultAlgorithm.id,
      });
    }

    return UserPassword.bulkCreate(records, { transaction });
  };

  /**
   * Update user custom fields
   * 1) it deletes non missing one
   * 2) updates existing ones
   * 3) add new ones
   *
   * @param {string} userId
   * @param {UserCustomField[]} userCustomFields
   * @param {UserCustomFieldInput[]} customFields
   * @param {Transaction} [transaction]
   * @returns {Promise<void>}
   */
  const updateUserCustomFields = async (
    userId: string,
    userCustomFields: UserCustomField[],
    customFields: UserCustomFieldInput[],
    transaction?: Transaction,
  ): Promise<void> => {
    // 1) remove fields that are not present
    const customFieldNames = customFields.map(field => field.name);
    await UserCustomField.destroy({
      where: {
        userId,
        name: { [Op.notIn]: customFieldNames },
      },
      transaction,
    });

    if (!customFields.length)
      return;

    for (const customField of customFields) {
      const { name, ...rest } = customField;

      const matchIdx = userCustomFields.findIndex(field => field.name === name);

      // 2) add new field
      if (matchIdx === -1) {
        await UserCustomField.create({ ...customField, userId }, { transaction });
        continue;
      }

      // 3) update existing fields
      await userCustomFields.at(matchIdx)?.update(rest, { transaction });
    }
  };

  /**
   * Update user password
   *
   * @param {string} userId
   * @param {string} password
   * @param {Transaction} [transaction]
   * @returns {Promise<UserPassword>}
   */
  const updatePassword = async (
    userId: string,
    password: string,
    transaction?: Transaction,
  ): Promise<UserPassword> => {
    const { hash, salt } = await defaultAlgorithm.hash(password);

    const [userPassword] = await UserPassword.upsert({
      userId,
      hash,
      salt,
      hasher: defaultAlgorithm.id,
    }, { transaction });
    await jwtRotationService.revokeByUser(userId, { transaction });

    return userPassword;
  };

  /**
   * Create new user & other associations. It creates:
   * - user record
   * - user password
   * - user custom fields
   * - user permissions
   * - user roles
   *
   * @param {UserInput} input
   * @param {CreateUserOptions} [options]
   * @returns {Promise<User>}
   */
  const create = async (input: UserInput, options: CreateUserOptions = {}): Promise<User> => {
    const { notify, userAgent } = options;
    const { password = randomString(12), permissions = [], roles = [], ...rest } = input;

    const user = await db.system.transaction(async (transaction) => {
      const user = await User.create(
        {
          ...rest,
          simpleName: toSimpleName(rest.name),
        },
        {
          include: [UserCustomField],
          transaction,
        },
      );

      await Promise.all([
        createPassword({ userId: user.id, password }, transaction),
        user.$set('permissions', permissions, { transaction }),
        user.$set('roles', roles, { transaction }),
      ]);

      return user;
    });

    const promises: Promise<any>[] = [];
    const { email } = user;
    if (email) {
      promises.push(commsService.subscribe('support', { email, name: user.name ?? undefined }));

      if (notify) {
        promises.push(scheduler.jobs.addJob({
          type: 'UserEmailVerificationNotification',
          params: { email, userAgent },
        }));
      }
    }

    await Promise.all(promises);

    return user;
  };

  /**
   * Update existing user and its associations. It updates:
   * - user record
   * - user custom fields
   * - user permissions
   * - user roles
   *
   * @param {string} userId
   * @param {UserInput} input
   * @returns {Promise<User>}
   */
  const update = async (userId: string, input: UserInput): Promise<User> => {
    const user = await User.scope('customFields').findByPk(userId);

    if (!user)
      throw new NotFoundError();

    if (!Object.keys(input).length)
      return user;

    const { customFields, permissions, roles, ...rest } = input;

    await db.system.transaction(async (transaction) => {
      await Promise.all([
        user.update({
          ...rest,
          simpleName: toSimpleName(rest.name),
        }, { transaction }),
        permissions
          ? user.$set('permissions', permissions, { transaction })
          : null,
        roles
          ? user.$set('roles', roles, { transaction })
          : null,
        customFields && user.customFields
          ? updateUserCustomFields(userId, user.customFields, customFields, transaction)
          : null,
      ].filter(Boolean));
    });

    await flushACLCacheByUserId(user.id);

    if (rest.disabledAt || !rest.verifiedAt)
      await flushPATCache(user.id);

    return user;
  };

  /**
   * Delete user record and its associations
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  const destroy = async (userId: string): Promise<void> => {
    const user = await User.scope('submissions').findByPk(userId, {
      attributes: ['id'],
    });
    if (!user)
      throw new NotFoundError();

    if (user.submissions?.length)
      throw new ForbiddenError('User cannot be deleted. It already contains submission data.');

    await user.destroy();
  };

  /**
   * Add permission(s) to user record by permission name(s)
   *
   * @param {(string | User)} userId
   * @param {(string | string[])} permissionName
   */
  const addPermissionByName = async (userId: string | User, permissionName: string | string[]) => {
    const user
      = typeof userId === 'string'
        ? await User.findByPk(userId, {
            attributes: ['id'],
          })
        : userId;
    if (!user)
      throw new NotFoundError();

    const permission = await Permission.findOne({
      attributes: ['id'],
      where: { name: permissionName },
    });
    if (!permission)
      throw new NotFoundError();

    await Promise.all([
      user.$add('permissions', permission),
      flushACLCacheByUserId(user.id),
    ]);
  };

  /**
   * Remove permission(s) from user record by permission name(s)
   *
   * @param {(string | User)} userId
   * @param {(string | string[])} permissionName
   */
  const removePermissionByName = async (
    userId: string | User,
    permissionName: string | string[],
  ) => {
    const user
      = typeof userId === 'string'
        ? await User.findByPk(userId, {
            attributes: ['id'],
          })
        : userId;
    if (!user)
      throw new NotFoundError();

    const permission = await Permission.findOne({
      attributes: ['id'],
      where: { name: permissionName },
    });
    if (!permission)
      throw new NotFoundError();

    await Promise.all([
      user.$remove('permissions', permission),
      flushACLCacheByUserId(user.id),
    ]);
  };

  /**
   * Fetch all user with survey support securable
   *
   * @param {string} surveyId
   * @returns {Promise<User[]>}
   */
  const getSurveySupportUsers = async (surveyId: string): Promise<User[]> =>
    User.findAll({
      where: {
        email: { [Op.ne]: null },
      },
      include: [
        {
          association: 'securables',
          where: { securableType: 'Survey', securableId: surveyId, action: 'support' },
          required: true,
        },
      ],
    });

  /**
   * Fetch all users with `globalSupport` permission
   *
   * @returns {Promise<User[]>}
   */
  const getGlobalSupportUsers = async (): Promise<User[]> => {
    const users = await Promise.all([
      User.findAll({
        where: {
          email: { [Op.ne]: null },
        },
        include: [
          {
            association: 'permissions',
            required: true,
            through: { attributes: [] },
            where: { name: globalSupport },
          },
        ],
      }),
      User.findAll({
        where: {
          email: { [Op.ne]: null },
        },
        include: [
          {
            association: 'roles',
            required: true,
            through: { attributes: [] },
            include: [
              {
                association: 'permissions',
                required: true,
                through: { attributes: [] },
                where: { name: globalSupport },
              },
            ],
          },
        ],
      }),
    ]);

    return uniqBy(users.flat(), 'id');
  };

  return {
    flushACLCache,
    flushACLCacheByUserId,
    flushACLCacheByRoleId,
    flushACLCacheByRoleName,
    flushSuperuserACLCache,
    assertPermissionsHeld,
    assertRolesHeld,
    assertCanManageUser,
    createPassword,
    createPasswords,
    updateUserCustomFields,
    updatePassword,
    create,
    update,
    destroy,
    addPermissionByName,
    removePermissionByName,
    getSurveySupportUsers,
    getGlobalSupportUsers,
  };
}

export default adminUserService;

export type AdminUserService = ReturnType<typeof adminUserService>;
