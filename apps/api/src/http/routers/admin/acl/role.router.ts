import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { roleEntryResponse } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { Permission, Role, User } from '@intake24/db';

async function uniqueMiddleware(value: any, { roleId }: { roleId?: string } = {}) {
  const where: WhereOptions = roleId ? { id: { [Op.ne]: roleId } } : {};

  if (!(await unique({ model: Role, condition: { field: 'name', value }, options: { where } }))) {
    throw ValidationError.from({ path: 'name', i18n: { type: 'unique._' } });
  }
}

export function role() {
  return initServer().router(contract.admin.acl.role, {
    browse: {
      middleware: [permission('acl', 'roles', 'roles:browse')],
      handler: async ({ query }) => {
        const roles = await Role.paginate({
          query,
          columns: ['name', 'displayName'],
          order: [[fn('lower', col('name')), 'ASC']],
        });

        return { status: 200, body: roles };
      },
    },
    store: {
      middleware: [permission('acl', 'roles', 'roles:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.name);

        const { name, displayName, description, permissions } = body;
        const role = await Role.create({ name, displayName, description });
        await role.$set('permissions', permissions);

        await Promise.all([
          role.reload({ include: [{ association: 'permissions' }] }),
          req.scope.cradle.adminUserService.flushACLCacheByRoleId(role.id),
        ]);

        return { status: 201, body: roleEntryResponse(role) };
      },
    },
    refs: {
      middleware: [permission('acl', 'roles')],
      handler: async () => {
        const permissions = await Permission.scope('list').findAll();

        return { status: 200, body: { permissions } };
      },
    },
    read: {
      middleware: [permission('acl', 'roles', 'roles:read')],
      handler: async ({ params: { roleId } }) => {
        const role = await Role.scope('permissions').findByPk(roleId);
        if (!role)
          throw new NotFoundError();

        return { status: 200, body: role };
      },
    },
    update: {
      middleware: [permission('acl', 'roles', 'roles:edit')],
      handler: async ({ body, params: { roleId }, req }) => {
        const role = await Role.scope('permissions').findByPk(roleId);
        if (!role)
          throw new NotFoundError();

        const { displayName, description } = body;
        await role.update({ displayName, description });

        const permissions = await Permission.scope('list').findAll();

        await role.$set(
          'permissions',
          role.name === req.scope.cradle.aclConfig.roles.superuser ? permissions : body.permissions,
        );

        await Promise.all([
          role.reload({ include: [{ association: 'permissions' }] }),
          req.scope.cradle.adminUserService.flushACLCacheByRoleId(role.id),
        ]);

        return { status: 200, body: roleEntryResponse(role) };
      },
    },
    destroy: {
      middleware: [permission('acl', 'roles', 'roles:delete')],
      handler: async ({ params: { roleId } }) => {
        const role = await Role.findByPk(roleId, { attributes: ['id'] });
        if (!role)
          throw new NotFoundError();

        await role.destroy();

        return { status: 204, body: undefined };
      },
    },
    permissions: {
      middleware: [permission('acl', 'roles', 'roles:permissions')],
      handler: async ({ params: { roleId }, query }) => {
        const role = await Role.findByPk(roleId, { attributes: ['id'] });
        if (!role)
          throw new NotFoundError();

        const permissions = await Permission.paginate({
          query,
          columns: ['name', 'displayName'],
          include: [{ association: 'roleLinks', attributes: ['roleId'], where: { roleId } }],
          order: [['name', 'ASC']],
        });

        return { status: 200, body: permissions };
      },
    },
    users: {
      middleware: [permission('acl', 'roles', 'roles:users')],
      handler: async ({ params: { roleId }, query }) => {
        const role = await Role.findByPk(roleId, { attributes: ['id'] });
        if (!role)
          throw new NotFoundError();

        const users = await User.paginate({
          query,
          columns: ['name', 'email', 'simpleName'],
          include: [{ association: 'roleLinks', attributes: ['roleId'], where: { roleId } }],
          order: [['name', 'ASC']],
        });

        return { status: 200, body: users };
      },
    },
  });
}
