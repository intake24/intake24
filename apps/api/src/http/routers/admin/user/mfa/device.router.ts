import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { contract } from '@intake24/common/contracts';
import { MFADevice, User } from '@intake24/db';

export function device() {
  return initServer().router(contract.admin.user.mfa.device, {
    browse: async ({ req }) => {
      const { userId } = req.scope.cradle.user;

      const user = await User.findByPk(userId, {
        include: [{ association: 'mfaDevices', where: { userId }, required: false }],
        order: [
          ['mfaDevices', 'preferred', 'DESC'],
          ['mfaDevices', 'id', 'ASC'],
        ],
      });
      if (!user)
        throw new NotFoundError();

      return {
        status: 200,
        body: { status: user.multiFactorAuthentication, devices: user.mfaDevices ?? [] },
      };
    },
    toggle: async ({ body: { status }, req }) => {
      const {
        securityConfig: { mfa },
        user: { userId },
      } = req.scope.cradle;

      const devices = await MFADevice.findAll({ attributes: ['id'], where: { userId } });
      if (!devices.length)
        throw new NotFoundError();

      if (mfa.mode === 'required' && !status)
        throw new ForbiddenError();

      await User.update({ multiFactorAuthentication: status }, { where: { id: userId } });

      return { status: 200, body: undefined };
    },
    read: async ({ params: { deviceId }, req }) => {
      const { userId } = req.scope.cradle.user;

      const device = await MFADevice.findOne({ where: { id: deviceId, userId } });
      if (!device)
        throw new NotFoundError();

      return { status: 200, body: device };
    },
    update: async ({ body: { preferred }, params: { deviceId }, req }) => {
      const { userId } = req.scope.cradle.user;

      const device = await MFADevice.findOne({ where: { id: deviceId, userId } });
      if (!device)
        throw new NotFoundError();

      await device.update({ preferred });

      if (preferred === true) {
        await MFADevice.update(
          { preferred: false },
          { where: { id: { [Op.ne]: deviceId }, userId } },
        );
      }

      return { status: 200, body: device };
    },
    destroy: async ({ params: { deviceId }, req }) => {
      const { userId } = req.scope.cradle.user;

      const device = await MFADevice.findOne({
        attributes: ['id'],
        where: { id: deviceId, userId },
      });
      if (!device)
        throw new NotFoundError();

      await device.destroy();

      const devices = await MFADevice.findAll({ attributes: ['id'], where: { userId } });
      if (!devices.length)
        await User.update({ multiFactorAuthentication: false }, { where: { id: userId } });

      return { status: 204, body: undefined };
    },
  });
}
