import { createReadStream } from 'node:fs';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { AsServedImageEntry } from '@intake24/common/types/http/admin';

export default () => {
  const baseUrl = '/api/admin/images/as-served-sets/asServedSetForImages/images';
  const invalidBaseUrl = '/api/admin/images/as-served-sets/InvalidAsServedSetForImages/images';
  const permissions = ['as-served-sets', 'as-served-sets:read'];

  const fileName = 'asServedImage_002.jpg';
  const label = { en: 'asServedImage_002_label' };
  const weight = 10;

  let url: string;
  const invalidUrl = `${baseUrl}/999999`;
  let invalidParentUrl: string;

  let output: AsServedImageEntry;

  beforeAll(async () => {
    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('label[en]', label.en)
      .field('weight', weight)
      .attach('image', createReadStream(suite.files.images.jpg), fileName);

    output = { ...body };

    url = `${baseUrl}/${output.id}`;
    invalidParentUrl = `${invalidBaseUrl}/${output.id}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when parent record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidParentUrl);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
