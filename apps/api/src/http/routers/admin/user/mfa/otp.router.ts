import type { Subject } from '@intake24/common/security';

import { initServer } from '@ts-rest/express';

import { ApplicationError } from '@intake24/api/http/errors';
import { atob } from '@intake24/api/util';
import { contract } from '@intake24/common/contracts';
import { randomString } from '@intake24/common/util';

export function otp() {
  return initServer().router(contract.admin.user.mfa.otp, {
    challenge: async ({ req }) => {
      const subject = atob<Subject>(req.scope.cradle.user.sub);
      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      const challengeId = randomString(32);
      const { secret, ...rest } = await req.scope.cradle.otpProvider.registrationChallenge(
        subject.providerKey,
      );

      req.session.otpRegChallenge = { challengeId, secret };

      return { status: 200, body: { challengeId, ...rest } };
    },
    verify: async ({ body, req }) => {
      const { sub, userId } = req.scope.cradle.user;
      const subject = atob<Subject>(sub);
      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      const { challengeId, name, token } = body;

      if (req.session.otpRegChallenge?.challengeId !== challengeId) {
        delete req.session.otpRegChallenge;
        throw new ApplicationError('Invalid session challenge, repeat device registration.');
      }

      const { secret } = req.session.otpRegChallenge;
      const device = await req.scope.cradle.otpProvider.registrationVerification({
        userId,
        email: subject.providerKey,
        name,
        token,
        secret,
      });

      delete req.session.otpRegChallenge;

      return { status: 200, body: device };
    },
  });
}
