import { ValidationError } from '@intake24/api/http/errors';
import { Permission, Role } from '@intake24/db';

export default async ({ permissions, roles }: { permissions?: string[]; roles?: string[] }): Promise<void> => {
  if (permissions) {
    const availablePermissions = await Permission.count({
      where: { id: permissions },
    });
    if (availablePermissions !== permissions.length) {
      throw ValidationError.from({
        path: 'permissions',
        i18n: { type: 'exists._' },
      });
    }
  }

  if (roles) {
    const availableRoles = await Role.count({
      where: { id: roles },
    });
    if (availableRoles !== roles.length) {
      throw ValidationError.from({
        path: 'roles',
        i18n: { type: 'exists._' },
      });
    }
  }
};
