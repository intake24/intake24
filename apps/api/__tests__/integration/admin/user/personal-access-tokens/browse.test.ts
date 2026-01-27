import type { Job } from '@intake24/db';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user/personal-access-tokens';

  it('missing authentication', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it('should return 200 and data list', async () => {
    await suite.util.setPermission([]);

    const { status, body } = await request(suite.app)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user);

    expect(status).toBe(200);
    expect(body).toContainAllKeys(['data', 'meta']);
    expect(body.data).toBeArray();

    const match = body.data.find((item: Job) => item.userId !== suite.data.system.user.id);
    expect(match).toBeUndefined();
  });
};
