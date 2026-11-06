import { z } from 'zod';

export type SubscriptionType = 'web-push';

export const webPushSubscription = z.object({
  endpoint: z.string(),
  expirationTime: z.union([
    z.number(),
    z.null(),
  ]),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
export type Subscription = z.infer<typeof webPushSubscription>;
