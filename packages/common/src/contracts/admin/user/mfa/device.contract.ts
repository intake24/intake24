import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { mfaDeviceResponse, mfaDevicesResponse } from '@intake24/common/types/http/admin';

const contract = initContract();

export const device = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/user/mfa',
    responses: {
      200: mfaDevicesResponse,
    },
    summary: 'Browse devices',
    description: 'Browse multi-factor authentication devices for user',
  },
  toggle: {
    method: 'POST',
    path: '/admin/user/mfa/toggle',
    body: z.object({
      status: z.boolean(),
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Toggle multi-factor authentication',
    description: 'Turn multi-factor authentication on or off for user',
  },
  read: {
    method: 'GET',
    path: '/admin/user/mfa/devices/:deviceId',
    responses: {
      200: mfaDeviceResponse,
    },
    summary: 'Device details',
    description: 'Get multi-factor authentication device details for user',
  },
  update: {
    method: 'PATCH',
    path: '/admin/user/mfa/devices/:deviceId',
    body: z.object({
      preferred: z.boolean(),
    }),
    responses: {
      200: mfaDeviceResponse,
    },
    summary: 'Update device',
    description: 'Update multi-factor authentication device for user',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/user/mfa/devices/:deviceId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete device',
    description: 'Delete multi-factor authentication device for user',
  },
});
