import type { ModelStatic } from 'sequelize';

import type { SecurableContract } from '@intake24/common/contracts/admin';
import type { Securable } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { userSecurablesResponse } from '@intake24/api/http/responses/admin';
import { isSecurableType } from '@intake24/common/security';
import { modelToRequestParam, randomString, securableToResource } from '@intake24/common/util';
import { User } from '@intake24/db';

export function securable(securable: ModelStatic<Securable>, contract: SecurableContract) {
  const securableType = securable.name;
  if (!isSecurableType(securableType))
    throw new Error('Invalid securable type');

  const resource = securableToResource(securableType);
  const paramId = modelToRequestParam(securableType);

  return initServer().router(contract, {
    browse: {
      middleware: [
        permission(resource),
      ],
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
          order: [
            ['email', 'ASC'],
          ],
          include: [
            {
              association: 'securables',
              where: { securableType, securableId },
            },
          ],
          transform: userSecurablesResponse,
        });

        return { status: 200, body: users };
      },
    },
    store: {
      middleware: [
        permission(resource),
      ],
      handler: async ({ body: { email, name, phone, actions }, req }) => {
        const { [paramId]: securableId } = req.params as Record<typeof paramId, string>;
        const { aclService, adminUserService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id'],
          where: { id: securableId },
        });

        const existingUser = await adminUserService.findUserByEmailForSecurable(email);

        if (existingUser && !existingUser.assignable) {
          throw ValidationError.from({
            code: '$unique',
            path: 'email',
            i18n: { type: 'unique._' },
          });
        }

        const userId = existingUser?.id ?? (await adminUserService.create({
          email,
          name,
          phone,
          password: randomString(12),
          verifiedAt: new Date(),
        })).id;

        await adminUserService.setSecurableActions(userId, { securableType, securableId }, actions);

        return { status: 201, body: undefined };
      },
    },
    update: {
      middleware: [
        permission(resource),
      ],
      handler: async ({ body: { actions }, params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: securableId, userId } = params;

        const { aclService, adminUserService } = req.scope.cradle;

        const [, user] = await Promise.all([
          aclService.findAndCheckRecordAccess(securable, 'securables', {
            attributes: ['id'],
            where: { id: securableId },
          }),
          adminUserService.findAssignableUser(userId),
        ]);
        if (!user)
          throw new NotFoundError();

        await adminUserService.setSecurableActions(userId, { securableType, securableId }, actions);

        return { status: 200, body: undefined };
      },
    },
    destroy: {
      middleware: [
        permission(resource),
      ],
      handler: async ({ params, req }) => {
        // @ts-expect-error dynamic contract type issue
        const { [paramId]: securableId, userId } = params;

        const { aclService, adminUserService } = req.scope.cradle;

        const [, user] = await Promise.all([
          aclService.findAndCheckRecordAccess(securable, 'securables', {
            attributes: ['id'],
            where: { id: securableId },
          }),
          User.findOne({
            attributes: ['id'],
            where: {
              id: userId,
              email: { [Op.ne]: null },
            },
          }),
        ]);
        if (!user)
          throw new NotFoundError();

        await adminUserService.removeSecurableAccess(userId, { securableType, securableId });

        return { status: 204, body: undefined };
      },
    },
    availableUsers: {
      middleware: [
        permission(resource),
      ],
      // @ts-expect-error dynamic contract type issue
      handler: async ({ params: { [paramId]: securableId }, query: { search }, req }) => {
        const { aclService, adminUserService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id'],
          where: { id: securableId },
        });

        if (!search)
          return { status: 200, body: [] };

        const match = await aclService.hasPermission('users:browse')
          ? 'partial'
          : 'exact';
        const users = await adminUserService.searchAssignableUsers({ securableType, securableId }, search, match);

        return { status: 200, body: users };
      },
    },
    owner: {
      middleware: [
        permission(resource),
      ],
      // @ts-expect-error dynamic contract type issue
      handler: async ({ body: { userId }, params: { [paramId]: securableId }, req }) => {
        const { aclService, adminUserService } = req.scope.cradle;

        if (userId && !await adminUserService.findAssignableUser(userId)) {
          throw ValidationError.from({
            path: 'userId',
            i18n: { type: 'exists._' },
          });
        }

        const securableRecord = await aclService.findAndCheckRecordAccess(securable, 'securables', {
          attributes: ['id', 'ownerId'],
          where: { id: securableId },
        });

        await adminUserService.setSecurableOwner(securableRecord, userId);

        return { status: 200, body: undefined };
      },
    },
  });
}
