import {
  intro,
  log,
  outro,
} from '@clack/prompts';
import color from 'picocolors';
import webPush from 'web-push';

export default async (): Promise<void> => {
  intro(color.cyan('Generate VAPID keys for Web Push notifications'));
  const vapidKeys = webPush.generateVAPIDKeys();
  log.success(`Public key: ${vapidKeys.publicKey}`);
  log.success(`Private key: ${vapidKeys.privateKey}`);
  outro('VAPID key generation complete.');
};
