import type { ImageMapEntry } from '@intake24/common/types/http/admin';

import { createReadStream } from 'node:fs';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/image-maps';
  const permissions = ['image-maps', 'image-maps:read'];

  const fileName = 'imageMap_002.jpg';
  const id = 'imageMap_002';
  const description = 'imageMap_002_description';
  const label = { en: 'imageMap_002_label' };

  const url = `${baseUrl}/${id}`;
  const invalidUrl = `${baseUrl}/999999`;

  let output: ImageMapEntry;

  beforeAll(async () => {
    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('id', id)
      .field('description', description)
      .field('label[en]', label.en)
      .attach('baseImage', createReadStream(suite.files.images.jpg), fileName);

    output = { ...body };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
