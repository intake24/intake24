import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user';

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it('should return 200 and profile data', async () => {
    const { status, body } = await request(suite.app)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user);

    expect(status).toBe(200);
    expect(body).toContainAllKeys(['profile', 'aal', 'permissions', 'roles']);
  });
};
