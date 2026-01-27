import type { CaptchaConfig } from '@intake24/api/config';
import type { CaptchaProvider } from '@intake24/common/security';

import { URLSearchParams } from 'node:url';

import axios from 'axios';

import { ValidationError } from '../errors';

export type CaptchaResponse = {
  success: boolean;

  challenge_ts: string;
  hostname: string;
  'error-codes': string[];
  score?: number;
  action?: string;
};

export type CaptchaCallback = (secret: string, response: string) => Promise<void>;

const hCaptcha: CaptchaCallback = async (secret: string, response: string) => {
  try {
    const { data: { success } = {} } = await axios.post<CaptchaResponse>(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({ secret, response }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (!success)
      throw new Error('Invalid hCaptcha challenge.');
  }
  catch {
    throw new Error('Invalid hCaptcha challenge.');
  }
};

const reCaptcha: CaptchaCallback = async (secret: string, response: string) => {
  try {
    const { data: { success } = {} } = await axios.post<CaptchaResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({ secret, response }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (!success)
      throw new Error('Invalid reCAPTCHA challenge.');
  }
  catch {
    throw new Error('Invalid reCAPTCHA challenge.');
  }
};

const captchaProviders: Record<CaptchaProvider, CaptchaCallback> = {
  'h-captcha': hCaptcha,
  're-captcha': reCaptcha,
};

export async function captcha(response: string | undefined, options: CaptchaConfig): Promise<void> {
  const { provider, secret } = options;
  if (!provider)
    return;

  if (typeof response !== 'string' || !response)
    throw new Error('Missing reCAPTCHA challenge response token.');

  await captchaProviders[provider](secret, response);
}

export default captcha;

export async function captchaCheck(token: string | undefined, options: CaptchaConfig) {
  try {
    await captcha(token, options);
  }
  catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : 'Invalid reCAPTCHA', {
      path: 'captcha',
    });
  }
}
