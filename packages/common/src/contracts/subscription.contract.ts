import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { webPushSubscription } from '../types/web-push';

const contract = initContract();

export const subscription = contract.router({
  subscribe: {
    method: 'POST',
    path: '/subscriptions',
    body: z.object({
      subscription: webPushSubscription,
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Subscribe to push notification',
    description:
      'Subscribe user to receive web-push notifications. It expects the subscription object produced by Web API PushManager',
  },
  unsubscribe: {
    method: 'DELETE',
    path: '/subscriptions',
    body: null,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Unsubscribe from push notification',
    description: 'Unsubscribe user from receiving web-push notifications.',
  },
  push: {
    method: 'POST',
    path: '/subscriptions/push',
    body: null,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Ping push',
    description: 'Send test push notification to user.',
  },
});
