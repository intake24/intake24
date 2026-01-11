import { createReadStream } from 'node:fs';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/as-served-sets/asServedSetForImages/images';
  const invalidBaseUrl = '/api/admin/images/as-served-sets/InvalidAsServedSetForImages/images';
  const permissions = ['as-served-sets', 'as-served-sets:delete'];

  const fileName = 'asServedImage_003.jpg';
  const label = { en: 'asServedImage_003_label' };
  const weight = 10;

  let url: string;
  const invalidUrl = `${baseUrl}/999999`;
  let invalidParentUrl: string;

  beforeAll(async () => {
    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('label[en]', label.en)
      .field('weight', weight)
      .attach('image', createReadStream(suite.files.images.jpg), fileName);

    const output = { ...body };

    url = `${baseUrl}/${output.id}`;
    invalidParentUrl = `${invalidBaseUrl}/${output.id}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when parent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidParentUrl);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });
};
