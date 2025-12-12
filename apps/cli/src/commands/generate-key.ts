import {
  intro,
  log,
  outro,
} from '@clack/prompts';
import { nanoid } from 'nanoid';
import color from 'picocolors';

export type GenerateKeyArgs = { length?: string };

export default async (cmd: GenerateKeyArgs): Promise<void> => {
  intro(color.cyan('Generate a random key'));
  const length = cmd.length ? Number.parseInt(cmd.length, 10) : 64;
  if (Number.isNaN(length) || length < 1) {
    log.error('Length must be a positive number');
    throw new Error('Provide positive number');
  }
  log.success(`Key: ${nanoid(length)}`);
  outro('Key generation complete');
};
