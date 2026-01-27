import type { AsServedSetEntry } from '@intake24/common/types/http/admin';

import { createReadStream } from 'node:fs';

import { pick } from 'lodash-es';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/images/as-served-sets';
  const permissions = ['as-served-sets', 'as-served-sets:create'];

  const fileName = 'asServedSet_001.jpg';
  const id = 'asServedSet_001';
  const description = 'asServedSet_001_description';
  const label = { en: 'asServedSet_001_label' };

  let filePath: string;
  let output: Omit<AsServedSetEntry, 'selectionImageUrl'>;

  beforeAll(async () => {
    filePath = suite.files.images.jpg;

    output = { id, description, label, images: [] };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description']);
    });

    it('should return 400 for invalid input data', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', '../../asServedSet_001')
        .field('description', [])
        .field('label', true);

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['id', 'description', 'label']);
    });

    it('should return 400 for invalid input file', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', id)
        .field('description', description)
        .field('selectionImage', 'notAFile');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['selectionImage']);
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', id)
        .field('description', description)
        .field('label[en]', label.en)
        .attach('selectionImage', createReadStream(filePath), fileName);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });

    it('should return 409 for duplicate id', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', id)
        .field('description', description)
        .field('label[en]', label.en)
        .attach('selectionImage', createReadStream(filePath), fileName);

      expect(status).toBe(409);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['id']);
    });
  });
};
