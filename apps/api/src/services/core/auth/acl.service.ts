import type { Attributes, FindOptions } from 'sequelize';

import type { RequestIoC } from '@intake24/api/ioc';
import type { Dictionary } from '@intake24/common/types';
import type { HasVisibility, ModelStatic, Securable } from '@intake24/db';

export interface CheckAccessOptions {
  params: Dictionary;
  scope?: string | string[];
}

function aclService({ globalAclService, user }: Pick<RequestIoC, 'globalAclService' | 'user'>) {
  const { userId } = user;

  /**
   * Get authenticated user permissions
   * - checks token payload if available
   * - otherwise fetches data from cache / database
   *
   * @returns {Promise<string[]>}
   */
  const getPermissions = async (): Promise<string[]> => user.permissions ?? globalAclService.getPermissions(userId);

  /**
   * Get authenticated user roles
   * - fetches data from database
   *
   * @returns {Promise<string[]>}
   */
  const getRoles = async (): Promise<string[]> => globalAclService.getRoles(userId);

  /**
   * Check is user has provided permission or each permission in provided list
   *
   * @param {(string | string[])} permission
   * @returns {Promise<boolean>}
   */
  const hasPermission = async (permission: string | string[]): Promise<boolean> => globalAclService.hasPermission(userId, permission);

  /**
   * Check is user has any permission in provided list
   *
   * @param {string[]} permissions
   * @returns {Promise<boolean>}
   */
  const hasAnyPermission = async (permissions: string[]): Promise<boolean> => globalAclService.hasAnyPermission(userId, permissions);

  /**
   * Check is user has provided role or each role in provided list
   *
   * @param {(string | string[])} role
   * @returns {Promise<boolean>}
   */
  const hasRole = async (role: string | string[]): Promise<boolean> => globalAclService.hasRole(userId, role);

  /**
   * Check is user has any role in provided list
   *
   * @param {string[]} roles
   * @returns {Promise<boolean>}
   */
  const hasAnyRole = async (roles: string[]): Promise<boolean> => globalAclService.hasAnyRole(userId, roles);

  const findAndCheckRecordAccess = async <T extends Securable>(
    securable: ModelStatic<T>,
    action: string,
    findOptions: FindOptions<Attributes<T>>,
  ): Promise<T> => globalAclService.findAndCheckRecordAccess(userId, securable, action, findOptions);

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
  ): Promise<T> => globalAclService.findAndCheckVisibility(userId, securable, action, findOptions);

  /**
   * Get user's list of resource-based access actions
   *
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getResourceAccessActions = async (resource: string): Promise<string[]> => globalAclService.getResourceAccessActions(userId, resource);

  /**
   * Get user's list of securable-based access actions
   *
   * @param {Securable} record
   * @returns {Promise<string[]>}
   */
  const getSecurableAccessActions = async (record: Securable): Promise<string[]> => globalAclService.getSecurableAccessActions(record);

  /**
   * Get user's combined list of resource-based & securable-based access actions
   *
   * @param {Securable} record
   * @param {string} resource
   * @returns {Promise<string[]>}
   */
  const getAccessActions = async (record: Securable, resource: string): Promise<string[]> => globalAclService.getAccessActions(userId, record, resource);

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
