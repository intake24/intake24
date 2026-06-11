import type { GlobalACLService } from '../../services/core/auth/global-acl.service';

import { AggregateLocalisableError, ForbiddenError, LocalisableError } from '@intake24/api/http/errors';
import { SystemLocale } from '@intake24/db';

async function checkLocalePermissions(
  globalAclService: GlobalACLService,
  userId: string,
  localeIds: Set<string>,
  permission: string,
): Promise<void> {
  const unauthorisedLocales = new Set<string>();

  const sortedLocaleIds = [...localeIds].toSorted();

  const checks = sortedLocaleIds.map(localeId => (
    globalAclService.findAndCheckRecordAccess(userId, SystemLocale, permission, {
      attributes: ['code'],
      where: { code: localeId },
    })));

  const results = await Promise.allSettled(checks);

  for (let i = 0; i < results.length; ++i) {
    const result = results[i];

    if (result.status === 'rejected') {
      const err = result.reason;

      if (err instanceof ForbiddenError) {
        unauthorisedLocales.add(sortedLocaleIds[i]);
      }
      else {
        throw result.reason;
      }
    }
  }

  if (unauthorisedLocales.size > 0) {
    throw new AggregateLocalisableError([...unauthorisedLocales].toSorted().map(locale => ({ key: 'io.permissions.foodListPermission', params: { locale } })));
  }
}

export async function checkFoodListPermissions(
  globalAclService: GlobalACLService,
  userId: string,
  localeIds: Set<string>,
): Promise<void> {
  return checkLocalePermissions(globalAclService, userId, localeIds, 'food-list');
}

export async function checkEditFoodListPermissions(
  globalAclService: GlobalACLService,
  userId: string,
  localeIds: Set<string>,
): Promise<void> {
  return checkLocalePermissions(globalAclService, userId, localeIds, 'food-list:edit');
}

/**
 * Check that the user is allowed to import the given target locales.
 *
 * Locales that already exist in the database require the per-locale
 * `food-list:edit` permission. Locales that do not exist yet will be created by
 * the import, so there is no record to check edit permissions against - those
 * require the global locale-create permission instead.
 */
export async function checkImportLocalePermissions(
  globalAclService: GlobalACLService,
  userId: string,
  localeIds: Set<string>,
): Promise<void> {
  if (localeIds.size === 0)
    return;

  const existingLocales = await SystemLocale.findAll({
    attributes: ['code'],
    where: { code: [...localeIds] },
  });

  const existingLocaleIds = new Set(existingLocales.map(locale => locale.code));
  const newLocaleIds = new Set([...localeIds].filter(id => !existingLocaleIds.has(id)));

  await Promise.all([
    existingLocaleIds.size > 0
      ? checkLocalePermissions(globalAclService, userId, existingLocaleIds, 'food-list:edit')
      : undefined,
    newLocaleIds.size > 0
      ? checkGlobalLocalePermissions(globalAclService, userId, true)
      : undefined,
  ]);
}

export async function checkGlobalLocalePermissions(
  globalAclService: GlobalACLService,
  userId: string,
  includeCreate: boolean,

): Promise<void> {
  const permissions = ['locales'];

  if (includeCreate)
    permissions.push('locales:create');

  const hasPermissions = await globalAclService.hasPermission(userId, permissions);

  if (!hasPermissions)
    throw new LocalisableError('io.permissions.localePermission');
}
