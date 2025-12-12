import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';
import { UserSubscription } from '@intake24/db';

export function subscription() {
  return initServer().router(contract.subscription, {
    subscribe: async ({ body, req }) => {
      const { userId } = req.scope.cradle.user;
      const { subscription } = body;

      const type = 'web-push';

      const subscriptions = await UserSubscription.findAll({
        attributes: ['id'],
        where: { userId, type, subscription },
      });

      if (!subscriptions.length)
        await UserSubscription.create({ userId, type, subscription });

      return { status: 200, body: undefined };
    },
    unsubscribe: async ({ req }) => {
      const { userId } = req.scope.cradle.user;

      await UserSubscription.destroy({ where: { userId, type: 'web-push' } });

      return { status: 204, body: undefined };
    },
    push: async ({ req }) => {
      const { userId } = req.scope.cradle.user;

      await req.scope.cradle.pusher.webPush(userId, {
        title: '🚀 Push notification!',
        body: `We'll keep you updated whenever your tasks are finished.`,
      });

      return { status: 200, body: undefined };
    },
  });
}
