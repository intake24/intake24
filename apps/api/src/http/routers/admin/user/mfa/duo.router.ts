import type { Subject } from '@intake24/common/security';

import { initServer } from '@ts-rest/express';

import { ApplicationError } from '@intake24/api/http/errors';
import { atob } from '@intake24/api/util';
import { contract } from '@intake24/common/contracts';

export function duo() {
  return initServer().router(contract.admin.user.mfa.duo, {
    challenge: async ({ req }) => {
      const subject = atob<Subject>(req.scope.cradle.user.sub);
      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      const options = await req.scope.cradle.duoProvider.registrationChallenge(subject.providerKey);

      req.session.duoRegChallenge = { challengeId: options.challengeId };

      return { status: 200, body: options };
    },
    verify: async ({ body, req }) => {
      const { sub, userId } = req.scope.cradle.user;
      const { challengeId, name, token } = body;
      const subject = atob<Subject>(sub);

      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      if (req.session.duoRegChallenge?.challengeId !== challengeId) {
        delete req.session.duoRegChallenge;
        throw new ApplicationError('Invalid session challenge, repeat device registration.');
      }

      const device = await req.scope.cradle.duoProvider.registrationVerification({
        userId,
        name,
        email: subject.providerKey,
        token,
      });

      delete req.session.duoRegChallenge;

      return { status: 200, body: device };
    },
  });
}
