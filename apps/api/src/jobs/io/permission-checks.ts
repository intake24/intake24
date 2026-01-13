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

  const sortedLocaleIds = [...localeIds].sort();

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
    throw new AggregateLocalisableError([...unauthorisedLocales].sort().map(locale => ({ key: 'io.permissions.foodListPermission', params: { locale } })));
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
