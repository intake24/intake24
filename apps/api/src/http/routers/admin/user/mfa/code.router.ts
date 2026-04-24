import type { Subject } from '@intake24/common/security';

import { initServer } from '@ts-rest/express';

import { ApplicationError, ValidationError } from '@intake24/api/http/errors';
import { atob } from '@intake24/api/util';
import { contract } from '@intake24/common/contracts';
import { randomString } from '@intake24/common/util';
import { UserPassword } from '@intake24/db/models';

export function code() {
  return initServer().router(contract.admin.user.mfa.code, {
    challenge: async ({ req }) => {
      const subject = atob<Subject>(req.scope.cradle.user.sub);
      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      const challengeId = randomString(32);

      req.session.codeRegChallenge = { challengeId };

      return { status: 200, body: { challengeId } };
    },
    verify: async ({ body, req }) => {
      const { sub, userId } = req.scope.cradle.user;
      const subject = atob<Subject>(sub);
      if (subject.provider !== 'email')
        throw new ApplicationError('Invalid user - missing email.');

      const { challengeId, name, password } = body;

      if (req.session.codeRegChallenge?.challengeId !== challengeId) {
        delete req.session.codeRegChallenge;
        throw new ApplicationError('Invalid session challenge, repeat device registration.');
      }

      const userPassword = await UserPassword.findByPk(userId);
      if (!userPassword
        || !(await req.scope.cradle.authenticationService.verifyPassword(password, userPassword))) {
        throw new ValidationError('Enter your current valid password.', { path: 'password' });
      }

      const { codes, hashes } = await req.scope.cradle.codeProvider.generateCodes();
      const device = await req.scope.cradle.codeProvider.registrationVerification({ userId, name, secret: JSON.stringify(hashes) });

      delete req.session.codeRegChallenge;

      return { status: 200, body: { codes, device } };
    },
  });
}
