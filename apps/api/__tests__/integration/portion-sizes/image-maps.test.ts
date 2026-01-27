import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/portion-sizes/image-maps';
  const url = `${baseUrl}?id=SetOne&id=SetTwo`;
  const invalidUrl = `${baseUrl}?id=InvalidSet`;

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput('get', baseUrl, ['id']);
  });

  it(`should return 200 and empty array when record doesn't exist`, async () => {
    const { status, body } = await request(suite.app)
      .get(invalidUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.respondent);

    expect(status).toBe(200);
    expect(body).toBeEmpty();
  });

  // TODO: tests for dummy data
};
