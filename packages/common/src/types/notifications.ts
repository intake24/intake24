import { z } from 'zod';

export const eventTypes = [
  'survey.session.started',
  'survey.session.cancelled',
  'survey.session.submitted',
] as const;

export type EventType = (typeof eventTypes)[number];

export const notificationChannels = ['webhook'] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export const emailNotification = z.object({
  type: z.enum(eventTypes),
  channel: z.literal('email'),
  to: z.email().toLowerCase(),
});

export type EmailNotification = z.infer<typeof emailNotification>;

export const slackNotification = z.object({
  type: z.enum(eventTypes),
  channel: z.literal('slack'),
  channelId: z.string(),
});

export type SlackNotification = z.infer<typeof slackNotification>;

export const webhookNotification = z.object({
  type: z.enum(eventTypes),
  channel: z.literal('webhook'),
  url: z.url(),
});

export type WebhookNotification = z.infer<typeof webhookNotification>;

export const notification = z.discriminatedUnion('channel', [
  emailNotification,
  slackNotification,
  webhookNotification,
]);

export type Notification = z.infer<typeof notification>;

export const notifications = z.object({
  email: emailNotification,
  slack: slackNotification,
  webhook: webhookNotification,
});

export type Notifications = z.infer<typeof notifications>;
