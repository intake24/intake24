import type { ExpressionBuilder } from 'kysely';
import type { Transaction } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';
import type { SecurableType } from '@intake24/common/security';
import type { UserCustomField as UserCustomFieldInput } from '@intake24/common/types';
import type { UserInput } from '@intake24/common/types/http/admin';
import type { Securable, SystemDB, UserPasswordAttributes } from '@intake24/db';

import { uniqBy, xor } from 'lodash-es';
import { Op } from 'sequelize';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { toSimpleName } from '@intake24/api/util';
import { defaultAlgorithm } from '@intake24/common-backend';
import { ACL_PAT_KEY, ACL_PERMISSIONS_KEY, ACL_ROLES_KEY, globalSupport, respondentSuffix } from '@intake24/common/security';
import { randomString } from '@intake24/common/util';
import {
  Permission,
  PersonalAccessToken,
  RoleUser,
  SurveySubmission,
  User,
  UserCustomField,
  UserPassword,
  UserSecurable,
} from '@intake24/db';

export type SecurableRecord = {
  securableType: SecurableType;
  securableId: string;
};

export type UserPasswordInput = {
  userId: string;
  password: string;
};

export type CreateUserOptions = {
  notify?: boolean;
  userAgent?: string;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

// Respondent = has a respondent permission or a survey alias, and no other permission (direct or via role) or securable access.
function notRespondent(eb: ExpressionBuilder<SystemDB, 'users'>) {
  const permissionNames = eb
    .selectFrom('permissions')
    .select('permissions.name')
    .where('permissions.id', 'in', eb
      .selectFrom('permissionUser')
      .select('permissionUser.permissionId')
      .whereRef('permissionUser.userId', '=', 'users.id')
      .union(eb
        .selectFrom('permissionRole')
        .innerJoin('roleUser', 'roleUser.roleId', 'permissionRole.roleId')
        .select('permissionRole.permissionId')
        .whereRef('roleUser.userId', '=', 'users.id')));

  return eb.or([
    eb.exists(permissionNames.where('permissions.name', 'not like', `%${respondentSuffix}`)),
    eb.exists(eb
      .selectFrom('userSecurables')
      .select('userSecurables.userId')
      .whereRef('userSecurables.userId', '=', 'users.id')),
    eb.not(eb.or([
      eb.exists(permissionNames.where('permissions.name', 'like', `%${respondentSuffix}`)),
      eb.exists(eb
        .selectFrom('userSurveyAliases')
        .select('userSurveyAliases.id')
        .whereRef('userSurveyAliases.userId', '=', 'users.id')),
    ])),
  ]);
}

function adminUserService({
  aclConfig,
  cache,
  commsService,
  db,
  jwtRotationService,
  kyselyDb,
  scheduler,
}: Pick<IoC, 'aclConfig' | 'cache' | 'commsService' | 'db' | 'jwtRotationService' | 'kyselyDb' | 'scheduler'>) {
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
      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'permissions',
            through: { attributes: [] },
          },
          {
            association: 'roles',
            through: { attributes: [] },
            include: [
              {
                association: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });
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
    const user = await User.findByPk(userId, {
      include: [
        { association: 'customFields', separate: true },
      ],
    });

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
    const user = await User.findByPk(userId, {
      attributes: ['id'],
    });
    if (!user)
      throw new NotFoundError();

    if (await SurveySubmission.findOne({
      attributes: ['id'],
      where: { userId },
    })) {
      throw new ForbiddenError('User cannot be deleted. It already contains submission data.');
    }

    await user.destroy();
  };

  /**
   * Find user with email who can be given securable access (not a respondent)
   */
  const findAssignableUser = (userId: string) =>
    kyselyDb.system
      .selectFrom('users')
      .select('users.id')
      .where('users.id', '=', userId)
      .where('users.email', 'is not', null)
      .where(notRespondent)
      .executeTakeFirst();

  /**
   * Find user by case-insensitive email, flagging whether they can be given securable access
   */
  const findUserByEmailForSecurable = (email: string) =>
    kyselyDb.system
      .selectFrom('users')
      .select(eb => [
        'users.id',
        notRespondent(eb).as('assignable'),
      ])
      .where('users.email', 'ilike', escapeLike(email))
      .orderBy('users.id')
      .executeTakeFirst();

  /**
   * Search users who can be given access to a securable record and don't have it yet (max 10)
   */
  const searchAssignableUsers = (securable: SecurableRecord, search: string, match: 'partial' | 'exact') => {
    const { securableType, securableId } = securable;
    const pattern = `%${escapeLike(search)}%`;

    return kyselyDb.system
      .selectFrom('users')
      .select(['users.id', 'users.name', 'users.email'])
      .where('users.email', 'is not', null)
      .where(eb => match === 'partial'
        ? eb.or([
            eb('users.name', 'ilike', pattern),
            eb('users.email', 'ilike', pattern),
          ])
        : eb('users.email', 'ilike', escapeLike(search)))
      .where(eb => eb.not(eb.exists(eb
        .selectFrom('userSecurables')
        .select('userSecurables.userId')
        .whereRef('userSecurables.userId', '=', 'users.id')
        .where('userSecurables.securableType', '=', securableType)
        .where('userSecurables.securableId', '=', securableId))))
      .where(notRespondent)
      .orderBy('users.email')
      .limit(10)
      .execute();
  };

  // Resource permissions implied by securables are derived in aclCache, so changes here only need an ACL cache flush.

  const setSecurableActions = async (userId: string, securable: SecurableRecord, actions: string[]) => {
    const { securableType, securableId } = securable;

    await db.system.transaction(async (transaction) => {
      await UserSecurable.destroy({
        where: { userId, securableType, securableId },
        transaction,
      });
      await UserSecurable.bulkCreate(
        actions.map(action => ({
          userId,
          securableType,
          securableId,
          action,
        })),
        { transaction },
      );
    });

    await flushACLCacheByUserId(userId);
  };

  const removeSecurableAccess = async (userId: string, securable: SecurableRecord) => {
    const { securableType, securableId } = securable;

    await UserSecurable.destroy({
      where: { userId, securableType, securableId },
    });
    await flushACLCacheByUserId(userId);
  };

  const setSecurableOwner = async (record: Securable, ownerId: string | null) => {
    const previousOwnerId = record.ownerId;

    await record.update({ ownerId });
    await Promise.all(
      [previousOwnerId, ownerId]
        .filter((userId): userId is string => !!userId)
        .map(flushACLCacheByUserId),
    );
  };

  /**
   * Delete a securable record with all users' securable access to it
   */
  const destroySecurable = async (securableType: SecurableType, record: Securable) => {
    const securableId = record.id;

    const userIds = await db.system.transaction(async (transaction) => {
      const securables = await UserSecurable.findAll({
        attributes: ['userId'],
        where: { securableType, securableId },
        transaction,
      });

      await UserSecurable.destroy({
        where: { securableType, securableId },
        transaction,
      });
      await record.destroy({ transaction });

      return securables.map(({ userId }) => userId);
    });

    const affected = new Set(record.ownerId
      ? [...userIds, record.ownerId]
      : userIds);
    await Promise.all([...affected].map(flushACLCacheByUserId));
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
    findAssignableUser,
    findUserByEmailForSecurable,
    searchAssignableUsers,
    setSecurableActions,
    removeSecurableAccess,
    setSecurableOwner,
    destroySecurable,
    getSurveySupportUsers,
    getGlobalSupportUsers,
  };
}

export default adminUserService;

export type AdminUserService = ReturnType<typeof adminUserService>;
