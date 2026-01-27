import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission as permissionMiddleware } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { Permission, Role, User } from '@intake24/db';

async function uniqueMiddleware(value: any, { permissionId }: { permissionId?: string } = {}) {
  const where: WhereOptions = permissionId ? { id: { [Op.ne]: permissionId } } : {};

  if (!(await unique({ model: Permission, condition: { field: 'name', value }, options: { where } }))) {
    throw ValidationError.from({ path: 'name', i18n: { type: 'unique._' } });
  }
}

export function permission() {
  return initServer().router(contract.admin.acl.permission, {
    browse: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:browse')],
      handler: async ({ query }) => {
        const permissions = await Permission.paginate({
          query,
          columns: ['name', 'displayName'],
          order: [[fn('lower', col('name')), 'ASC']],
        });

        return { status: 200, body: permissions };
      },
    },
    store: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.name);

        const [permission] = await Promise.all([
          Permission.create(body),
          req.scope.cradle.adminUserService.flushSuperuserACLCache(),
        ]);

        return { status: 201, body: permission };
      },
    },
    read: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:read')],
      handler: async ({ params: { permissionId } }) => {
        const permission = await Permission.findByPk(permissionId);
        if (!permission)
          throw new NotFoundError();

        return { status: 200, body: permission };
      },
    },
    update: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:edit')],
      handler: async ({ body, params: { permissionId } }) => {
        const permission = await Permission.findByPk(permissionId);
        if (!permission)
          throw new NotFoundError();

        await permission.update(body);

        return { status: 200, body: permission };
      },
    },
    destroy: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:delete')],
      handler: async ({ params: { permissionId } }) => {
        const permission = await Permission.findByPk(permissionId, { attributes: ['id'] });
        if (!permission)
          throw new NotFoundError();

        await permission.destroy();

        return { status: 204, body: undefined };
      },
    },
    roles: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:roles')],
      handler: async ({ params: { permissionId }, query }) => {
        const permission = await Permission.findByPk(permissionId, { attributes: ['id'] });
        if (!permission)
          throw new NotFoundError();

        const roles = await Role.paginate({
          query,
          columns: ['name', 'displayName'],
          include: [
            { association: 'permissionLinks', attributes: ['permissionId'], where: { permissionId } },
          ],
          order: [['name', 'ASC']],
        });

        return { status: 200, body: roles };
      },
    },
    users: {
      middleware: [permissionMiddleware('acl', 'permissions', 'permissions:users')],
      handler: async ({ params: { permissionId }, query }) => {
        const permission = await Permission.findByPk(permissionId, { attributes: ['id'] });
        if (!permission)
          throw new NotFoundError();

        const users = await User.paginate({
          query,
          columns: ['name', 'email', 'simpleName'],
          include: [
            { association: 'permissionLinks', attributes: ['permissionId'], where: { permissionId } },
          ],
          order: [['name', 'ASC']],
        });

        return { status: 200, body: users };
      },
    },
  });
}
