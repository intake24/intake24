import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

import type { IoC } from '@intake24/api/ioc';
import type { FIDOAuthChallenge } from '@intake24/common/security';

import { URL } from 'node:url';

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

import { ValidationError } from '@intake24/api/http/errors';
import { getFrontEndUrl } from '@intake24/api/util';
import { randomString } from '@intake24/common/util';
import { MFAAuthenticator, MFADevice } from '@intake24/db';

export type FIDORegistrationVerificationOps = {
  userId: string;
  name: string;
  expectedChallenge: string;
  response: RegistrationResponseJSON;
};

export type FIDOAuthenticationVerificationOps = {
  authenticator: MFAAuthenticator;
  challengeId: string;
  response: AuthenticationResponseJSON;
};

function fidoProvider({
  db,
  appConfig,
  securityConfig,
}: Pick<IoC, 'db' | 'appConfig' | 'securityConfig'>) {
  const provider = 'fido';
  const { issuer } = securityConfig.mfa.providers[provider];
  const rpID = new URL(getFrontEndUrl(appConfig.urls.base, appConfig.urls.admin)).hostname;
  if (!rpID)
    throw new Error('Cannot resolve admin domain from URL');

  const origin = appConfig.urls.admin;

  const registrationChallenge = async (
    userID: string,
    userName?: string,
    userDisplayName?: string,
  ) => {
    const authenticators = await MFAAuthenticator.findAll({
      include: [{ association: 'device', where: { userId: userID } }],
    });

    return generateRegistrationOptions({
      rpName: issuer,
      rpID,
      userID: isoUint8Array.fromUTF8String(userID),
      userName: userName ?? userID,
      userDisplayName: userDisplayName ?? userName ?? userID,
      attestationType: 'none',
      excludeCredentials: authenticators.map(authenticator => ({
        id: authenticator.id,
        transports: authenticator.transports,
      })),
    });
  };

  const registrationVerification = async (ops: FIDORegistrationVerificationOps) => {
    const { userId, name, expectedChallenge, response } = ops;
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      response,
    });

    if (!verified || !registrationInfo)
      throw new ValidationError('Invalid FIDO challenge.', { path: 'response' });

    return db.system.transaction(async (transaction) => {
      const device = await MFADevice.create(
        { userId, provider: 'fido', name, secret: randomString(32) },
        { transaction },
      );

      const { credential: { id, publicKey, counter, transports = [] }, credentialDeviceType, credentialBackedUp }
        = registrationInfo;

      await MFAAuthenticator.create(
        {
          id,
          deviceId: device.id,
          publicKey,
          counter: counter.toString(),
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports,
        },
        { transaction },
      );

      return device;
    });
  };

  /**
   * Create FIDO authentication request
   *
   * @param {MFADevice} device
   * @returns {Promise<FIDOAuthChallenge>}
   */
  const authenticationChallenge = async (device: MFADevice): Promise<FIDOAuthChallenge> => {
    if (!device.authenticator)
      throw new Error('No FIDO authenticator found.');

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [device.authenticator].map(authenticator => ({
        id: authenticator.id,
        transports: authenticator.transports,
      })),
      userVerification: 'preferred',
    });

    return { challengeId: options.challenge, deviceId: device.id, provider, options };
  };

  /**
   * Verify FIDO authentication response
   *
   * @param {FIDOAuthenticationVerificationOps} ops
   * @returns
   */
  const authenticationVerification = async (ops: FIDOAuthenticationVerificationOps) => {
    const { authenticator, challengeId, response } = ops;

    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeId,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.id,
        publicKey: authenticator.publicKey,
        counter: Number.parseInt(authenticator.counter, 10),
        transports: authenticator.transports,
      },
    });

    if (!verified || !authenticationInfo)
      throw new Error('Invalid FIDO challenge.');

    return { verified, authenticationInfo };
  };

  return {
    registrationChallenge,
    registrationVerification,
    authenticationChallenge,
    authenticationVerification,
  };
}

export default fidoProvider;

export type FIDOProvider = ReturnType<typeof fidoProvider>;
