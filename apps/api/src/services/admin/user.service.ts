import { uniqBy } from 'lodash-es';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import { defaultAlgorithm } from '@intake24/common-backend';
import { ACL_PERMISSIONS_KEY, ACL_ROLES_KEY, globalSupport } from '@intake24/common/security';
import type { UserCustomField as UserCustomFieldInput } from '@intake24/common/types';
import type { UserInput } from '@intake24/common/types/http/admin';
import { randomString } from '@intake24/common/util';
import type { Transaction, UserPasswordAttributes } from '@intake24/db';
import { Op, Permission, RoleUser, User, UserCustomField, UserPassword } from '@intake24/db';

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
  scheduler,
}: Pick<IoC, 'aclConfig' | 'cache' | 'commsService' | 'db' | 'scheduler'>) {
  /**
   * Flush user ACL cache by user ID
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  const flushACLCacheByUserId = async (userId: string): Promise<void> => {
    await cache.forget([`${ACL_PERMISSIONS_KEY}:${userId}`, `${ACL_ROLES_KEY}:${userId}`]);
  };

  /**
   * Flush user ACL cache by role ID
   *
   * @param {string} roleId
   * @returns {Promise<void>}
   */
  const flushACLCacheByRoleId = async (roleId: string): Promise<void> => {
    const roleUsers = await RoleUser.findAll({ where: { roleId } });

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
      include: [{ association: 'role', where: { name }, required: true }],
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
    const { salt, hash } = await defaultAlgorithm.hash(password);

    return UserPassword.create(
      {
        userId,
        passwordSalt: salt,
        passwordHash: hash,
        passwordHasher: defaultAlgorithm.id,
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
      const { salt, hash } = await defaultAlgorithm.hash(password);

      records.push({
        userId,
        passwordSalt: salt,
        passwordHash: hash,
        passwordHasher: defaultAlgorithm.id,
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
      where: { userId, name: { [Op.notIn]: customFieldNames } },
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
      await userCustomFields[matchIdx].update(rest, { transaction });
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
    const userPassword = await UserPassword.findByPk(userId);
    if (!userPassword)
      throw new NotFoundError();

    const { salt, hash } = await defaultAlgorithm.hash(password);

    return userPassword.update(
      {
        passwordSalt: salt,
        passwordHash: hash,
        passwordHasher: defaultAlgorithm.id,
      },
      { transaction },
    );
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
        { ...rest, simpleName: toSimpleName(rest.name) },
        { include: [UserCustomField], transaction },
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
        promises.push(scheduler.jobs.addJob({ type: 'UserEmailVerificationNotification', params: { email, userAgent } }));
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
        user.update({ ...rest, simpleName: toSimpleName(rest.name) }, { transaction }),
        permissions ? user.$set('permissions', permissions, { transaction }) : null,
        roles ? user.$set('roles', roles, { transaction }) : null,
        customFields && user.customFields ? updateUserCustomFields(userId, user.customFields, customFields, transaction) : null,
      ].filter(Boolean));

      await flushACLCacheByUserId(user.id);
    });

    return user;
  };

  /**
   * Delete user record and its associations
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  const destroy = async (userId: string): Promise<void> => {
    const user = await User.scope('submissions').findByPk(userId, { attributes: ['id'] });
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
      = typeof userId === 'string' ? await User.findByPk(userId, { attributes: ['id'] }) : userId;
    if (!user)
      throw new NotFoundError();

    const permission = await Permission.findOne({
      attributes: ['id'],
      where: { name: permissionName },
    });
    if (!permission)
      throw new NotFoundError();

    await Promise.all([user.$add('permissions', permission), flushACLCacheByUserId(user.id)]);
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
      = typeof userId === 'string' ? await User.findByPk(userId, { attributes: ['id'] }) : userId;
    if (!user)
      throw new NotFoundError();

    const permission = await Permission.findOne({
      attributes: ['id'],
      where: { name: permissionName },
    });
    if (!permission)
      throw new NotFoundError();

    await Promise.all([user.$remove('permissions', permission), flushACLCacheByUserId(user.id)]);
  };

  /**
   * Fetch all user with survey support securable
   *
   * @param {string} surveyId
   * @returns {Promise<User[]>}
   */
  const getSurveySupportUsers = async (surveyId: string): Promise<User[]> =>
    User.findAll({
      where: { email: { [Op.ne]: null } },
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
        where: { email: { [Op.ne]: null } },
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
        where: { email: { [Op.ne]: null } },
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
    flushACLCacheByUserId,
    flushACLCacheByRoleId,
    flushACLCacheByRoleName,
    flushSuperuserACLCache,
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
