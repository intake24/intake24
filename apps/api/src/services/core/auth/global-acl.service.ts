import type { Attributes, FindOptions, ModelStatic } from 'sequelize';

import type { IoC } from '@intake24/api/ioc';
import type { SecurableType } from '@intake24/common/security';
import type { HasVisibility, Securable } from '@intake24/db';

import { xor } from 'lodash-es';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { isSecurableType, securableDefs } from '@intake24/common/security';
import { resourceToModel, securableToResource } from '@intake24/common/util';
import { securableIncludes } from '@intake24/db';

function globalAclService({ aclCache, models }: Pick<IoC, 'aclCache' | 'db' | 'models'>) {
  const securableModels = {
    FAQ: models.system.FAQ,
    FeedbackScheme: models.system.FeedbackScheme,
    Language: models.system.Language,
    Locale: models.system.SystemLocale,
    Survey: models.system.Survey,
    SurveyScheme: models.system.SurveyScheme,
  };
  /**
   * Get user permissions
   *
   * @returns {Promise<string[]>}
   */
  const getPermissions = async (userId: string): Promise<string[]> => aclCache.getPermissions(userId);

  /**
   * Get user roles
   *
   * @returns {Promise<string[]>}
   */
  const getRoles = async (userId: string): Promise<string[]> => aclCache.getRoles(userId);

  /**
   * Check is user has provided permission or each permission in provided list
   *
   * @param {string} userId
   * @param {(string | string[])} permission
   * @returns {Promise<boolean>}
   */
  const hasPermission = async (userId: string, permission: string | string[]): Promise<boolean> => {
    const currentPermissions = await getPermissions(userId);
    if (!currentPermissions.length)
      return false;

    if (Array.isArray(permission))
      return permission.every(item => currentPermissions.includes(item));

    return currentPermissions.includes(permission);
  };

  /**
   * Check is user has any permission in provided list
   *
   * @param {string} userId
   * @param {string[]} permissions
   * @returns {Promise<boolean>}
   */
  const hasAnyPermission = async (userId: string, permissions: string[]): Promise<boolean> => {
    const currentPermissions = await getPermissions(userId);
    if (!currentPermissions.length)
      return false;

    return currentPermissions.some(item => permissions.includes(item));
  };

  /**
   * Check is user has provided role or each role in provided list
   *
   * @param {string} userId
   * @param {(string | string[])} role
   * @returns {Promise<boolean>}
   */
  const hasRole = async (userId: string, role: string | string[]): Promise<boolean> => {
    const currentRoles = await getRoles(userId);
    if (!currentRoles.length)
      return false;

    if (Array.isArray(role))
      return role.every(name => currentRoles.includes(name));

    return currentRoles.includes(role);
  };

  /**
   * Check is user has any role in provided list
   *
   * @param {string} userId
   * @param {string[]} roles
   * @returns {Promise<boolean>}
   */
  const hasAnyRole = async (userId: string, roles: string[]): Promise<boolean> => {
    const currentRoles = await getRoles(userId);
    if (!currentRoles.length)
      return false;

    return currentRoles.some(item => roles.includes(item));
  };

  /**
   * Check is user can access record based on
   * - resource permissions
   *
   * @param {string} userId
   * @param {string} securableType
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  const hasResourceAccess = async (userId: string, securableType: string, action: string): Promise<boolean> => {
    const resource = securableToResource(securableType);

    return hasPermission(userId, `${resource}:${action}`);
  };

  /**
   * Check is user can access record based on
   * - securable actions
   * - ownership
   *
   * @param {string} userId
   * @param {Securable} securable
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  const hasSecurableAccess = async (userId: string, securable: Securable, action: string): Promise<boolean> => {
    const isOwner = securable.ownerId === userId;
    const canAccess = !!securable.securables?.find(
      sec => sec.userId === userId && sec.action === action,
    );

    return isOwner || canAccess;
  };

  function resolveSecurable(securableType: string) {
    return isSecurableType(securableType)
      ? securableModels[securableType]
      : undefined;
  }

  const findAndCheckRecordAccess = async <T extends Securable>(
    userId: string,
    securable: ModelStatic<T>,
    action: string,
    findOptions: FindOptions<Attributes<T>>,
  ): Promise<T> => {
    const { attributes, include, ...rest } = findOptions;
    if (Array.isArray(attributes) && !attributes.includes('ownerId'))
      attributes.push('ownerId');

    const record = await securable.findOne({
      ...rest,
      attributes,
      include: [
        ...(Array.isArray(include)
          ? include
          : []),
        ...securableIncludes(userId),
      ],
    });

    if (await hasResourceAccess(userId, securable.name, action)) {
      if (!record)
        throw new NotFoundError();

      return record;
    }

    if (!record || !(await hasSecurableAccess(userId, record, action)))
      throw new ForbiddenError();

    return record;
  };

  /**
   * Find record and check visibility
   *
   * @template T
   * @param {string} userId
   * @param {ModelStatic<T>} securable
   * @param {string} action
   * @param {FindOptions<Attributes<T>>} findOptions
   * @returns {Promise<T>}
   */
  const findAndCheckVisibility = async <T extends HasVisibility>(
    userId: string,
    securable: ModelStatic<T>,
    action: string,
    findOptions: FindOptions<Attributes<T>>,
  ): Promise<T> => {
    const { attributes, include, ...rest } = findOptions;
    if (Array.isArray(attributes)) {
      ['ownerId', 'visibility'].forEach((attribute) => {
        if (!attributes.includes(attribute))
          attributes.push(attribute);
      });
    }

    const record = await securable.findOne({
      ...rest,
      attributes,
      include: [
        ...(Array.isArray(include)
          ? include
          : []),
        ...securableIncludes(userId),
      ],
    });

    if (await hasResourceAccess(userId, securable.name, action)) {
      if (!record)
        throw new NotFoundError();

      return record;
    }

    if (!record || (record.visibility !== 'public' && !(await hasSecurableAccess(userId, record, action))))
      throw new ForbiddenError();

    return record;
  };

  /**
   * Check is user has access to resource for provided action
   *
   * @template T
   * @param {string} userId
   * @param {string} resource
   * @param {string} action
   * @param {FindOptions<Attributes<T>>} findOptions
   * @returns {Promise<void>}
   */
  async function checkAccess<T extends Securable>(
    userId: string,
    resource: string,
    action: string,
    findOptions: FindOptions<Attributes<T>>,
  ): Promise<void> {
    if (await hasPermission(userId, `${resource}:${action}`))
      return;

    const securable = resolveSecurable(resourceToModel(resource));
    if (!securable)
      throw new ForbiddenError();

    await findAndCheckRecordAccess(userId, securable as unknown as ModelStatic<T>, action, findOptions);
  }

  /**
   * Get user's list of resource-based access actions
   *
   * @param {string} userId
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getResourceAccessActions = async (userId: string, resource: string): Promise<string[]> =>
    (await getPermissions(userId))
      .filter(permission => permission.startsWith(`${resource}:`))
      .map(permission => permission.replace(`${resource}:`, ''));

  /**
   * Get user's list of securable-based access actions
   *
   * @param {Securable} record
   * @returns {Promise<string[]>}
   */
  const getSecurableAccessActions = async (record: Securable): Promise<string[]> =>
    record.securables?.map(({ action }) => action) ?? [];

  /**
   * Get user's combined list of resource-based & securable-based access actions
   *
   * @param {string} userId
   * @param {Securable} record
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getAccessActions = async (userId: string, record: Securable, resource: string): Promise<string[]> => {
    const [resourceActions, securableActions] = await Promise.all([
      getResourceAccessActions(userId, resource),
      getSecurableAccessActions(record),
    ]);

    return [
      ...new Set([
        ...resourceActions,
        ...securableActions,
      ]),
    ];
  };

  /**
   * Check user can change record ownership - only owner or holder of resource-level `securables` permission
   *
   * @param {string} userId
   * @param {SecurableType} securableType
   * @param {Securable} record
   * @returns {Promise<void>}
   */
  const checkSecurableOwnerChange = async (userId: string, securableType: SecurableType, record: Securable): Promise<void> => {
    if (record.ownerId === userId)
      return;

    if (!await hasResourceAccess(userId, securableType, 'securables'))
      throw new ForbiddenError();
  };

  /**
   * Check user can change other user's securable actions on a record - user can only add or remove actions they hold, owner holds all of them
   *
   * `record` must include user's securables. `targetUserId` is null for user yet to be created.
   *
   * @param {string} userId
   * @param {SecurableType} securableType
   * @param {Securable} record
   * @param {(string | null)} targetUserId
   * @param {string[]} actions
   * @returns {Promise<void>}
   */
  const checkSecurableActionsChange = async (
    userId: string,
    securableType: SecurableType,
    record: Securable,
    targetUserId: string | null,
    actions: string[],
  ): Promise<void> => {
    const actionDefs: readonly string[] = securableDefs[securableType];

    const [held, current] = await Promise.all([
      record.ownerId === userId
        ? actionDefs
        : getAccessActions(userId, record, securableToResource(securableType)),
      targetUserId
        ? models.system.UserSecurable.findAll({
            attributes: ['action'],
            where: { userId: targetUserId, securableType, securableId: record.id },
          }).then(securables => securables.map(({ action }) => action))
        : [],
    ]);

    if (xor(current, actions).some(action => !actionDefs.includes(action) || !held.includes(action)))
      throw new ForbiddenError();
  };

  return {
    getPermissions,
    getRoles,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    checkAccess,
    findAndCheckRecordAccess,
    findAndCheckVisibility,
    getResourceAccessActions,
    getSecurableAccessActions,
    getAccessActions,
    checkSecurableOwnerChange,
    checkSecurableActionsChange,
  };
}

export default globalAclService;

export type GlobalACLService = ReturnType<typeof globalAclService>;
