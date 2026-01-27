import type { IoC } from '@intake24/api/ioc';
import type { DuoAuthChallenge } from '@intake24/common/security';

import { URL } from 'node:url';

import { Client } from '@duosecurity/duo_universal';

import { randomString } from '@intake24/common/util';
import { MFADevice } from '@intake24/db';

export type DuoRegistrationVerificationOps = {
  userId: string;
  name: string;
  email: string;
  token: string;
};

export type DuoAuthenticationVerificationOps = {
  email: string;
  token: string;
};

function duoProvider({
  logger: globalLogger,
  securityConfig,
}: Pick<IoC, 'logger' | 'securityConfig'>) {
  const logger = globalLogger.child({ service: 'DuoProvider' });
  const provider = 'duo';
  const config = securityConfig.mfa.providers[provider];

  const challenge = async (
    email: string,
    redirectUrlContext = '',
  ): Promise<Omit<DuoAuthChallenge, 'deviceId'>> => {
    const { clientId, clientSecret, apiHost } = config;
    const redirectUrl = new URL(redirectUrlContext, config.redirectUrl).href;

    try {
      const duoClient = new Client({
        clientId,
        clientSecret,
        apiHost,
        redirectUrl,
        useDuoCodeAttribute: false,
      });

      const { stat } = await duoClient.healthCheck();
      if (stat !== 'OK')
        throw new Error('Duo service not available.');

      const challengeId = duoClient.generateState();
      const challengeUrl = await duoClient.createAuthUrl(email, challengeId);

      return { challengeId, provider, challengeUrl };
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.debug(`${name}: ${message}`, { stack });
        throw new Error(message);
      }

      throw new Error('Duo challenge unknown error occurred.');
    }
  };

  const registrationChallenge = async (email: string) => challenge(email, 'user');

  const authenticationChallenge = async (device: MFADevice): Promise<DuoAuthChallenge> => {
    if (!device.user?.email)
      throw new Error('Duo device with credentials not found.');

    const challengePayload = await challenge(device.user?.email);

    return { ...challengePayload, deviceId: device.id };
  };

  const verification = async (ops: DuoAuthenticationVerificationOps, redirectUrlContext = '') => {
    const { email, token } = ops;
    const { clientId, clientSecret, apiHost } = config;
    const redirectUrl = new URL(redirectUrlContext, config.redirectUrl).href;

    try {
      const duoClient = new Client({
        clientId,
        clientSecret,
        apiHost,
        redirectUrl,
        useDuoCodeAttribute: false,
      });

      const { stat } = await duoClient.healthCheck();
      if (stat !== 'OK')
        throw new Error('Duo service not available.');

      return await duoClient.exchangeAuthorizationCodeFor2FAResult(token, email);
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.debug(`${name}: ${message}`, { stack });
        throw new Error(message);
      }

      throw new Error('Duo verification unknown error occurred.');
    }
  };

  const registrationVerification = async (ops: DuoRegistrationVerificationOps) => {
    const { userId, name, email, token } = ops;
    await verification({ email, token }, 'user');

    return MFADevice.create({
      userId,
      provider: 'duo',
      name,
      secret: randomString(32),
    });
  };

  const authenticationVerification = async (ops: DuoAuthenticationVerificationOps) =>
    verification(ops);

  return {
    registrationChallenge,
    registrationVerification,
    authenticationChallenge,
    authenticationVerification,
  };
}

export default duoProvider;

export type DuoProvider = ReturnType<typeof duoProvider>;
