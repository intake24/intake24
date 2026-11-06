import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user/personal-access-tokens';

  let input: { name: string; expiresAt: string };
  let jwt: string;

  beforeAll(async () => {
    input = {
      name: 'my token',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
    };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([]);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name', 'expiresAt']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name', 'expiresAt'], {
        input: {
          name: ['should be a string'],
          expiresAt: 'not a date',
        },
      });
    });

    it('should return 201 with jwt & token record', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(201);

      expect(body.jwt).toBeString();
      expect(body.token.name).toBe(input.name);

      jwt = body.jwt;
    });

    it('should return 200 with personal access token', async () => {
      const { status, body } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`);

      expect(status).toBe(200);
      expect(body).toContainAllKeys(['data', 'meta']);
      expect(body.data).toBeArray();
    });
  });
};
