import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/guide-images';
  const permissions = ['guide-images:delete'];

  const input = {
    id: 'guideImage_005',
    description: 'guideImage_005_description',
    label: { en: 'guideImage_005_label' },
    imageMapId: 'imageMapForGuide',
  };

  const url = `${baseUrl}/${input.id}`;
  const invalidUrl = `${baseUrl}/999999`;

  beforeAll(async () => {
    await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send(input);
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });
};
