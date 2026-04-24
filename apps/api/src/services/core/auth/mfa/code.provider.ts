import type { CodeAuthChallenge } from '@intake24/common/security';

import { defaultAlgorithm } from '@intake24/common-backend';
import { randomString } from '@intake24/common/util';
import { MFADevice } from '@intake24/db';

export type CodeRegistrationVerificationOps = {
  userId: string;
  name: string;
  secret: string;
};

export type CodeAuthenticationVerificationOps = {
  deviceId: string;
  secret: string;
  token: string;
};

function codeProvider() {
  const provider = 'code';

  const generateCodes = async () => {
    const codes = [];
    const hashes = [];
    for (let i = 0; i < 6; i++) {
      const code = randomString(12, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
      const { hash } = await defaultAlgorithm.hash(code);
      codes.push(code);
      hashes.push(hash);
    }

    return { codes, hashes };
  };

  const registrationVerification = async (ops: CodeRegistrationVerificationOps) => {
    const { userId, name, secret } = ops;

    return MFADevice.create({ userId, provider, name, secret });
  };

  /**
   * Create code authentication request
   *
   * @param {MFADevice} device
   * @returns {Promise<CodeAuthChallenge>}
   */
  const authenticationChallenge = async (device: MFADevice): Promise<CodeAuthChallenge> => ({
    challengeId: randomString(32),
    deviceId: device.id,
    provider,
  });

  /**
   * Verify code authentication response
   *
   * @param {CodeAuthenticationVerificationOps} ops
   * @returns
   */
  const authenticationVerification = async (ops: CodeAuthenticationVerificationOps) => {
    const { deviceId, secret, token } = ops;
    const hashes = JSON.parse(secret) as string[];

    let index: number | undefined;

    for (const [idx, hash] of Object.entries(hashes)) {
      const match = await defaultAlgorithm.verify(token, { hash, salt: '' });
      if (match) {
        index = Number.parseInt(idx, 10);
        break;
      }
    }

    if (index === undefined)
      throw new Error('Invalid code');

    hashes.splice(index, 1);

    await (hashes.length
      ? MFADevice.update({ secret: JSON.stringify(hashes) }, { where: { id: deviceId } })
      : MFADevice.destroy({ where: { id: deviceId } }));
  };

  return {
    generateCodes,
    registrationVerification,
    authenticationChallenge,
    authenticationVerification,
  };
}

export default codeProvider;

export type CodeProvider = ReturnType<typeof codeProvider>;
