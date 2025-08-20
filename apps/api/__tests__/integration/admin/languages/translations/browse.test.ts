import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const permissions = ['languages', 'languages:translations'];

  let languageId: string;
  let url: string;

  beforeAll(async () => {
    languageId = suite.data.system.Language.id;

    url = `/api/admin/languages/${languageId}/translations`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  it('should return 200 and results', async () => {
    await suite.util.setPermission(permissions);

    const { status, body } = await request(suite.app)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .send();

    expect(status).toBe(200);
    expect(body).toBeArray();
  });
};
