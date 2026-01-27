import type { SecurableContract } from '@intake24/common/contracts/admin';
import type {
  ModelStatic,
  Securable,
  UserSecurableAttributes,
  UserSecurableCreationAttributes,
} from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { userSecurablesResponse } from '@intake24/api/http/responses/admin';
import ioc from '@intake24/api/ioc';
import { isSecurableType } from '@intake24/common/security';
import {
  getResourceFromSecurable,
  modelToRequestParam,
  randomString,
} from '@intake24/common/util';
import {
  User,
  UserSecurable,
} from '@intake24/db';

export function securable(securable: ModelStatic<Securable>, contract: SecurableContract) {
  const securableType = securable.name;
  if (!isSecurableType(securableType))
    throw new Error('Invalid securable type');

  const resource = getResourceFromSecurable(securableType);
  const paramId = modelToRequestParam(securableType);

  const addSecurableAccess = async (
    user: User,
    resource: string,
    records: UserSecurableCreationAttributes[],
    removeSecurable?: Pick<UserSecurableAttributes, 'userId' | 'securableType' | 'securableId'>,
  ) => {
    if (removeSecurable)
      await UserSecurable.destroy({ where: removeSecurable });

    await Promise.all([
      UserSecurable.bulkCreate(records),
      ioc.cradle.adminUserService.addPermissionByName(user, resource),
    ]);
  };

  const removeSecurableAccess = async (
    user: User,
    resource: string,
    securable: Pick<UserSecurableAttributes, 'userId' | 'securableType' | 'securableId'>,
  ) => {
    const { userId, securableType, securableId } = securable;
    const otherSecurables = await UserSecurable.findAll({
      attributes: ['userId'],
      where: { userId, securableType, securableId: { [Op.ne]: securableId } },
    });

    await Promise.all(
      [
        UserSecurable.destroy({ where: securable }),
        otherSecurables.length ? null : ioc.cradle.adminUserService.removePermissionByName(user, resource),
      ].filter(Boolean),
    );
  };

  return initServer().router(contract, {
    browse: {
      middleware: [permission(resource)],
      handler: async ({ query, req }) => {
        const { [paramId]: securableId } = req.params;

        await req.scope.cradle.aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id'],
          where: { id: securableId },
        });

        const users = await User.paginate({
          query,
          columns: ['name', 'email', 'simpleName'],
          attributes: ['id', 'email', 'name'],
          order: [['email', 'ASC']],
          include: [{ association: 'securables', where: { securableType, securableId } }],
          transform: userSecurablesResponse,
        });

        return { status: 200, body: users };
      },
    },
    store: {
      middleware: [permission(resource)],
      handler: async ({ body: { email, name, phone, actions }, req }) => {
        const { params: { [paramId]: securableId } } = req;
        const { aclService, adminUserService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id'],
          where: { id: securableId },
        });

        const user = await adminUserService.create({
          email,
          name,
          phone,
          password: randomString(12),
          verifiedAt: new Date(),
        });

        if (actions.length) {
          const records = actions.map(action => ({
            userId: user.id,
            securableId,
            securableType,
            action,
          }));

          await addSecurableAccess(user, resource, records);
        }

        return { status: 201, body: undefined };
      },
    },
    update: {
      middleware: [permission(resource)],
      handler: async ({ body: { actions }, params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: securableId, userId } = params;

        const [, user] = await Promise.all([
          req.scope.cradle.aclService.findAndCheckRecordAccess(securable, 'securables', {
            attributes: ['id'],
            where: { id: securableId },
          }),
          User.findOne({
            attributes: ['id'],
            where: { id: userId, email: { [Op.ne]: null } },
            include: [
              { association: 'securables', required: false, where: { securableType, securableId } },
            ],
          }),
        ]);
        if (!user)
          throw new NotFoundError();

        const securableInput = { userId, securableId, securableType };

        if (actions.length) {
          const currentActions = user.securables?.map(sec => sec.action).sort() ?? [];
          const actionsMatch
            = actions.length === currentActions.length
              && actions.sort().every((action, idx) => action === currentActions[idx]);

          if (!actionsMatch) {
            const records = actions.map(action => ({ ...securableInput, action }));
            await addSecurableAccess(user, resource, records, securableInput);
          }
        }
        else {
          await removeSecurableAccess(user, resource, securableInput);
        }

        return { status: 200, body: undefined };
      },
    },
    destroy: {
      middleware: [permission(resource)],
      handler: async ({ params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: securableId, userId } = params;

        const { aclService } = req.scope.cradle;

        const [, user] = await Promise.all([
          aclService.findAndCheckRecordAccess(securable, 'securables', {
            attributes: ['id'],
            where: { id: securableId },
          }),
          User.findOne({ attributes: ['id'], where: { id: userId, email: { [Op.ne]: null } } }),
        ]);
        if (!user)
          throw new NotFoundError();

        await removeSecurableAccess(user, resource, { userId, securableId, securableType });

        return { status: 204, body: undefined };
      },
    },
    availableUsers: {
      middleware: [permission(resource)],
      // @ts-expect-error dynamic contract type issue
      handler: async ({ params: { [paramId]: securableId }, query: { search }, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id'],
          where: { id: securableId },
        });

        if (!search)
          return { status: 200, body: [] };

        const op
          = User.sequelize?.getDialect() === 'postgres'
            ? { [Op.iLike]: `%${search}%` }
            : { [Op.substring]: search };

        const users = await User.findAll({
          attributes: ['id', 'name', 'email'],
          where: {
            email: { [Op.ne]: null },
            '$securables.user_id$': { [Op.eq]: null },
            [Op.or]: { name: op, email: op },
          },
          order: [['email', 'ASC']],
          limit: 10,
          subQuery: false,
          include: [
            {
              association: 'securables',
              attributes: [],
              required: false,
              where: { securableType, securableId },
            },
          ],
        });

        return { status: 200, body: users };
      },
    },
    owner: {
      middleware: [permission(resource)],
      // @ts-expect-error dynamic contract type issue
      handler: async ({ body: { userId }, params: { [paramId]: securableId }, req }) => {
        if (userId) {
          const user = User.findOne({ attributes: ['id'], where: { id: userId, email: { [Op.ne]: null } } });
          if (!user) {
            throw ValidationError.from({ path: 'userId', i18n: { type: 'exists._' } });
          }
        }

        const securableRecord = await req.scope.cradle.aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id', 'ownerId'],
          where: { id: securableId },
        });

        await securableRecord.update({ ownerId: userId });

        return { status: 200, body: undefined };
      },
    },
  });
}
