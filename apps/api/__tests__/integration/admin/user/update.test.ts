import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user';

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('patch', url);
  });

  it('should return 400 for invalid input data', async () => {
    await suite.sharedTests.assertInvalidInput('patch', url, ['name', 'phone'], { input: { name: false, phone: 123456 } });
  });

  it('should return 200 and profile data', async () => {
    const { status, body } = await request(suite.app)
      .patch(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .send({ name: 'Updated name', phone: '+447777111222' });

    expect(status).toBe(200);
    expect(body).toBeEmpty();
  });
};
