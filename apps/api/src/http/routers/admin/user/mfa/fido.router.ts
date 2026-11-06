import { initServer } from '@ts-rest/express';

import { ApplicationError } from '@intake24/api/http/errors';
import { contract } from '@intake24/common/contracts';
import { User } from '@intake24/db';

export function fido() {
  return initServer().router(contract.admin.user.mfa.fido, {
    challenge: async ({ req }) => {
      const { userId } = req.scope.cradle.user;
      const user = await User.findByPk(userId, {
        attributes: ['email', 'name'],
      });
      if (!user?.email)
        throw new ApplicationError('Invalid user - missing email.');

      const options = await req.scope.cradle.fidoProvider.registrationChallenge(
        userId,
        user.email,
        user.name ?? undefined,
      );

      req.session.fidoRegChallenge = { challengeId: options.challenge };

      return { status: 200, body: options };
    },
    verify: async ({ body, req }) => {
      const { userId } = req.scope.cradle.user;
      const { challengeId, name, response } = body;

      if (req.session.fidoRegChallenge?.challengeId !== challengeId) {
        delete req.session.fidoRegChallenge;
        throw new ApplicationError('Invalid session challenge, repeat device registration.');
      }

      const device = await req.scope.cradle.fidoProvider.registrationVerification({
        userId,
        name,
        expectedChallenge: challengeId,
        response,
      });

      delete req.session.fidoRegChallenge;

      return { status: 200, body: device };
    },
  });
}
