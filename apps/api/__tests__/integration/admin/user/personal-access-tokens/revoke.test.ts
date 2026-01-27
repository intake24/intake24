import type { AmrMethod } from '@intake24/common/security';
import type { PersonalAccessToken } from '@intake24/db';

import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/user/personal-access-tokens';

  let url: string;
  let invalidUrl: string;

  let input: {
    name: string;
    expiresAt: Date;
    verified: boolean;
    aal: 'aal1' | 'aal2';
    amr: AmrMethod[];
  };
  let pat: { jwt: string; token: PersonalAccessToken };

  beforeAll(async () => {
    input = mocker.system.personalAccessToken();
    const { name, expiresAt, ...rest } = input;

    pat = await ioc.cradle.jwtService.issuePersonalAccessToken(
      name,
      {
        userId: suite.data.system.user.id,
        ...rest,
      },
      expiresAt,
    );

    url = `${baseUrl}/${pat.token.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('delete', url);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([]);
    });

    it('should return 200 with personal access token', async () => {
      const { status } = await request(suite.app)
        .get(baseUrl)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${pat.jwt}`);

      expect(status).toBe(200);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });

    it('should return 401 with revoked personal access token', async () => {
      const { status } = await request(suite.app)
        .get(baseUrl)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${pat.jwt}`);

      expect(status).toBe(401);
    });
  });
};
