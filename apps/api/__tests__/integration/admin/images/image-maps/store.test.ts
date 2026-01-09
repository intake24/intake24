import fs from 'fs-extra';
import { pick } from 'lodash-es';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { ImageMapEntry } from '@intake24/common/types/http/admin';

export default () => {
  const url = '/api/admin/images/image-maps';
  const permissions = ['image-maps', 'image-maps:create'];

  const fileName = 'imageMap_001.jpg';
  const id = 'imageMap_001';
  const description = 'imageMap_001_description';
  const label = { en: 'imageMap_001_label' };

  let filePath: string;
  let output: Omit<ImageMapEntry, 'baseImageUrl'>;

  beforeAll(async () => {
    filePath = suite.files.images.jpg;

    output = { id, description, label, objects: [] };
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
        .field('id', '/etc/imageMap_001')
        .field('description', [])
        .field('label', 'label');

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
        .field('baseImage', 'not-a-file');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['baseImage']);
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', id)
        .field('description', description)
        .field('label[en]', label.en)
        .attach('baseImage', fs.createReadStream(filePath), fileName);

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
        .attach('baseImage', fs.createReadStream(filePath), fileName);

      expect(status).toBe(409);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['id']);
    });
  });
};
