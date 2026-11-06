import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';
import { PersonalAccessToken } from '@intake24/db';

export function personalAccessToken() {
  return initServer().router(contract.admin.user.personalAccessToken, {
    browse: async ({ query, req }) => {
      const { userId } = req.scope.cradle.user;

      const tokens = await PersonalAccessToken.paginate({
        query,
        columns: ['name'],
        attributes: [
          'id',
          'userId',
          'name',
          'createdAt',
          'revoked',
          'usedAt',
          'expiresAt',
        ],
        where: { userId },
        order: [
          ['name', 'ASC'],
        ],
      });

      return { status: 200, body: tokens };
    },
    store: async ({ body, req }) => {
      const { name, expiresAt } = body;
      const { aal, amr, verified, userId } = req.scope.cradle.user;

      const { jwt, token } = await req.scope.cradle.jwtService.issuePersonalAccessToken(
        name,
        { aal, amr, verified, userId },
        expiresAt,
      );

      return {
        status: 201,
        body: { jwt, token },
      };
    },
    revoke: async ({ params: { tokenId }, req }) => {
      const { userId } = req.scope.cradle.user;

      await req.scope.cradle.jwtService.revokePersonalAccessToken(tokenId, userId);
      return { status: 204, body: undefined };
    },
  });
}
