import type { IoC } from '@intake24/api/ioc';
import type { OTPAuthChallenge } from '@intake24/common/security';

import { TOTP } from 'otpauth';
import QRCode from 'qrcode';

import { ValidationError } from '@intake24/api/http/errors';
import { randomString } from '@intake24/common/util';
import { MFADevice } from '@intake24/db';

export type OTPRegistrationVerificationOps = {
  userId: string;
  email: string;
  name: string;
  token: string;
  secret: string;
};

export type OTPAuthenticationVerificationOps = {
  email: string;
  token: string;
  secret: string;
};

function optProvider({ securityConfig }: Pick<IoC, 'securityConfig'>) {
  const provider = 'otp';
  const { issuer } = securityConfig.mfa.providers[provider];
  const algorithm = 'SHA1';

  const registrationChallenge = async (email: string) => {
    const secret = randomString(20, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');

    const totp = new TOTP({ issuer, label: `${issuer}:${email}`, algorithm, secret });
    const url = totp.toString();
    const qrCode = await QRCode.toDataURL(url);

    return { secret, url, qrCode };
  };

  const registrationVerification = async (ops: OTPRegistrationVerificationOps) => {
    const { userId, email, name, token, secret } = ops;

    const totp = new TOTP({ issuer, label: `${issuer}:${email}`, algorithm, secret });

    const delta = totp.validate({ token });
    if (delta === null)
      throw new ValidationError('Invalid OTP token.', { path: 'token' });

    return MFADevice.create({ userId, provider: 'otp', name, secret });
  };

  /**
   * Create OTP authentication request
   *
   * @param {MFADevice} device
   * @returns {Promise<OTPAuthChallenge>}
   */
  const authenticationChallenge = async (device: MFADevice): Promise<OTPAuthChallenge> => ({
    challengeId: randomString(32),
    deviceId: device.id,
    provider,
  });

  /**
   * Verify OTP authentication response
   *
   * @param {OTPAuthenticationVerificationOps} ops
   * @returns
   */
  const authenticationVerification = async (ops: OTPAuthenticationVerificationOps) => {
    const { email, secret, token } = ops;

    const totp = new TOTP({ issuer, label: `${issuer}:${email}`, algorithm, secret });

    const delta = totp.validate({ token });
    if (delta === null)
      throw new Error('Invalid OTP token');

    return delta;
  };

  return {
    registrationChallenge,
    registrationVerification,
    authenticationChallenge,
    authenticationVerification,
  };
}

export default optProvider;

export type OTPProvider = ReturnType<typeof optProvider>;
