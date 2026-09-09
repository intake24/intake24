import type { GlobalACLService } from '@intake24/api/services/core/auth/global-acl.service';

import { vi } from 'vitest';

import { checkImportLocalePermissions } from '@intake24/api/jobs/io/permission-checks';
import { SystemLocale } from '@intake24/db';

vi.mock('@intake24/db', () => ({
  SystemLocale: { findAll: vi.fn() },
}));

describe('import locale validation', () => {
  const hasPermission = vi.fn();
  const findAndCheckRecordAccess = vi.fn();
  const acl = { hasPermission, findAndCheckRecordAccess } as unknown as GlobalACLService;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(SystemLocale.findAll).mockResolvedValue([]);
    hasPermission.mockResolvedValue(true);
    findAndCheckRecordAccess.mockResolvedValue({});
  });

  it.each([
    ['missing or deselected locales file', []],
    ['locale definition for a different locale', ['other']],
  ])('rejects a nonexistent target with %s even with create permission', async (_description, definitions) => {
    await expect(checkImportLocalePermissions(acl, 'user', new Set(['missing']), new Set(definitions)))
      .rejects
      .toMatchObject({
        details: [{ key: 'io.importJob.missingLocale', params: { locale: 'missing' } }],
      });
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('allows an existing locale without a package definition', async () => {
    vi.mocked(SystemLocale.findAll).mockResolvedValue([{ code: 'existing' }] as SystemLocale[]);

    await expect(checkImportLocalePermissions(acl, 'user', new Set(['existing']), new Set()))
      .resolves
      .toBeUndefined();
    expect(findAndCheckRecordAccess).toHaveBeenCalledWith('user', SystemLocale, 'food-list:edit', {
      attributes: ['code'],
      where: { code: 'existing' },
    });
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('allows a new locale with an included definition and create permission', async () => {
    await expect(checkImportLocalePermissions(acl, 'user', new Set(['new']), new Set(['new'])))
      .resolves
      .toBeUndefined();
    expect(hasPermission).toHaveBeenCalledWith('user', ['locales', 'locales:create']);
  });

  it('still requires create permission for a new locale with a definition', async () => {
    hasPermission.mockResolvedValue(false);

    await expect(checkImportLocalePermissions(acl, 'user', new Set(['new']), new Set(['new'])))
      .rejects
      .toMatchObject({ details: { key: 'io.permissions.localePermission' } });
  });
});
