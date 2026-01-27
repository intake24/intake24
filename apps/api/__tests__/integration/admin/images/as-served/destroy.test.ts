import { createReadStream } from 'node:fs';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/as-served-sets';
  const permissions = ['as-served-sets', 'as-served-sets:delete'];

  const fileName = 'asServedSet_005.jpg';
  const id = 'asServedSet_005';
  const description = 'asServedSet_005_description';
  const label = { en: 'asServedSet_005_label' };

  const url = `${baseUrl}/${id}`;
  const invalidUrl = `${baseUrl}/999999`;

  beforeAll(async () => {
    await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('id', id)
      .field('description', description)
      .field('label[en]', label.en)
      .attach('selectionImage', createReadStream(suite.files.images.jpg), fileName);
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
