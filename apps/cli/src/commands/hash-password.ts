import {
  intro,
  log,
  outro,
  spinner,
} from '@clack/prompts';
import color from 'picocolors';

import { PasswordBcrypt } from '@intake24/common-backend';

export default async (password: string): Promise<void> => {
  intro(color.cyan('Generating password hash with salt using bcrypt'));
  const s = spinner();
  s.start('Generating password hash and salt');
  const hasher = new PasswordBcrypt();
  const hash = await hasher.hash(password);
  log.success(`Hash: ${hash.hash}`);
  log.success(`Salt: ${hash.salt}`);
  s.stop('Generation complete.');
  outro('Done.');
};
