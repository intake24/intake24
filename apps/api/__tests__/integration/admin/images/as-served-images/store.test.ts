import { createReadStream } from 'node:fs';
import { pick } from 'lodash-es';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { AsServedImageEntry } from '@intake24/common/types/http/admin';

export default () => {
  const url = '/api/admin/images/as-served-sets/asServedSetForImages/images';
  const invalidUrl = '/api/admin/images/as-served-sets/invalidAsServedSetForImages/images';
  const permissions = ['as-served-sets', 'as-served-sets:create'];

  const fileName = 'asServedImage_001.jpg';
  const label = { en: 'asServedImage_001_label' };
  const weight = 10;

  let filePath: string;
  let output: Pick<AsServedImageEntry, 'weight'>;

  beforeAll(async () => {
    filePath = suite.files.images.jpg;

    output = { weight };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when parent record doesn't exist`, async () => {
      const { status } = await request(suite.app)
        .post(invalidUrl)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('label[en]', label.en)
        .field('weight', weight)
        .attach('image', createReadStream(filePath), fileName);

      expect(status).toBe(404);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['weight']);
    });

    it('should return 400 for invalid input data', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('label', 1)
        .field('weight', 'notANumber')
        .field('image', 'notAFile');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['label', 'weight']);
    });

    it('should return 400 for invalid input file', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('weight', weight)
        .field('image', 'notAFile');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['image']);
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('label[en]', label.en)
        .field('weight', weight)
        .attach('image', createReadStream(filePath), fileName);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });
  });
};
