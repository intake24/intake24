import type { Attributes, FindOptions } from 'sequelize';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import type { RequestIoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import { getResourceFromSecurable } from '@intake24/common/util';
import type { HasVisibility, ModelStatic, Securable } from '@intake24/db';
import { securableIncludes } from '@intake24/db';

export interface CheckAccessOptions {
  params: Dictionary;
  scope?: string | string[];
}

function aclService({ aclCache, user }: Pick<RequestIoC, 'aclCache' | 'aclConfig' | 'user'>) {
  const { userId } = user;

  /**
   * Get authenticated user permissions
   * - checks token payload if available
   * - otherwise fetches data from cache / database
   *
   * @returns {Promise<string[]>}
   */
  const getPermissions = async (): Promise<string[]> =>
    user.permissions ?? aclCache.getPermissions(userId);

  /**
   * Get authenticated user roles
   * - fetches data from database
   *
   * @returns {Promise<string[]>}
   */
  const getRoles = async (): Promise<string[]> => aclCache.getRoles(userId);

  /**
   * Check is user has provided permission or each permission in provided list
   *
   * @param {(string | string[])} permission
   * @returns {Promise<boolean>}
   */
  const hasPermission = async (permission: string | string[]): Promise<boolean> => {
    const currentPermissions = await getPermissions();
    if (!currentPermissions.length)
      return false;

    if (Array.isArray(permission))
      return permission.every(item => currentPermissions.includes(item));

    return !!currentPermissions.find(name => name === permission);
  };

  /**
   * Check is user has any permission in provided list
   *
   * @param {string[]} permissions
   * @returns {Promise<boolean>}
   */
  const hasAnyPermission = async (permissions: string[]): Promise<boolean> => {
    const currentPermissions = await getPermissions();
    if (!currentPermissions.length)
      return false;

    return currentPermissions.some(item => permissions.includes(item));
  };

  /**
   * Check is user has provided role or each role in provided list
   *
   * @param {(string | string[])} role
   * @returns {Promise<boolean>}
   */
  const hasRole = async (role: string | string[]): Promise<boolean> => {
    const currentRoles = await getRoles();
    if (!currentRoles.length)
      return false;

    if (Array.isArray(role))
      return role.every(name => currentRoles.includes(name));

    return !!currentRoles.find(name => name === role);
  };

  /**
   * Check is user has any role in provided list
   *
   * @param {string[]} roles
   * @returns {Promise<boolean>}
   */
  const hasAnyRole = async (roles: string[]): Promise<boolean> => {
    const currentRoles = await getRoles();
    if (!currentRoles.length)
      return false;

    return currentRoles.some(item => roles.includes(item));
  };

  /**
   * Check is user can access record based on
   * - securable actions
   * - ownership
   *
   * @param {Securable} securable
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  const hasSecurableAccess = async (securable: Securable, action: string): Promise<boolean> => {
    const isOwner = securable.ownerId === userId;
    const canAccess = !!securable.securables?.find(
      sec => sec.userId === userId && sec.action === action,
    );

    return isOwner || canAccess;
  };

  /**
   * Check is user can access record based on
   * - resource permissions
   *
   * @param {string} securableType
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  const hasResourceAccess = async (securableType: string, action: string): Promise<boolean> => {
    const resource = getResourceFromSecurable(securableType);

    return hasPermission(`${resource}:${action}`);
  };

  /**
   * Helper for `findAndCheckRecordAccess`
   *
   * @template T
   * @param {ModelStatic<T>} securable
   * @param {string} action
   * @param {(T | null)} record
   * @returns {Promise<T>}
   */
  const checkRecordAccess = async <T extends Securable>(
    securable: ModelStatic<T>,
    action: string,
    record: T | null,
  ): Promise<T> => {
    if (await hasResourceAccess(securable.name, action)) {
      if (!record)
        throw new NotFoundError();

      return record;
    }

    if (!record || !(await hasSecurableAccess(record, action)))
      throw new ForbiddenError();

    return record;
  };

  const findAndCheckRecordAccess = async <T extends Securable>(
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
      include: [...(Array.isArray(include) ? include : []), ...securableIncludes(userId)],
    });

    return checkRecordAccess(securable, action, record);
  };

  /**
   * Find record and check visibility
   *
   * @template T
   * @param {ModelStatic<T>} securable
   * @param {string} action
   * @param {FindOptions<Attributes<T>>} findOptions
   * @returns {Promise<T>}
   */
  const findAndCheckVisibility = async <T extends HasVisibility>(
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
      include: [...(Array.isArray(include) ? include : []), ...securableIncludes(userId)],
    });

    if (await hasResourceAccess(securable.name, action)) {
      if (!record)
        throw new NotFoundError();

      return record;
    }

    if (!record || (record.visibility !== 'public' && !(await hasSecurableAccess(record, action))))
      throw new ForbiddenError();

    return record;
  };

  /**
   * Get user's list of resource-based access actions
   *
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getResourceAccessActions = async (resource: string): Promise<string[]> =>
    (await getPermissions())
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
   * @param {Securable} record
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getAccessActions = async (record: Securable, resource: string): Promise<string[]> => {
    const [resourceActions, securableActions] = await Promise.all([
      getResourceAccessActions(resource),
      getSecurableAccessActions(record),
    ]);

    return [...new Set([...resourceActions, ...securableActions])];
  };

  return {
    getPermissions,
    getRoles,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    findAndCheckRecordAccess,
    findAndCheckVisibility,
    getResourceAccessActions,
    getSecurableAccessActions,
    getAccessActions,
  };
}

export default aclService;

export type ACLService = ReturnType<typeof aclService>;
