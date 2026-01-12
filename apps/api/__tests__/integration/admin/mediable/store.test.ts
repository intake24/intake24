import { createReadStream } from 'node:fs';
import request from 'supertest';
import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { suite } from '@intake24/api-tests/integration/helpers';
import type { MediaEntry, MediaModel } from '@intake24/common/types/http/admin';
import { modelToResource } from '@intake24/common/util';
import type { Securable } from '@intake24/db';

export default (type: MediaModel) => () => {
  const resource = modelToResource(type);
  const baseUrl = `/api/admin/${resource}`;
  const permissions = [resource, `${resource}:media`];

  let url: string;

  let securable: SetSecurableOptions;
  let securableModel: Securable;

  let filePath: string;
  let output: Omit<MediaEntry, 'id' | 'mimetype' | 'size' | 'createdAt' | 'updatedAt' | 'url' | 'sizes'>;

  beforeAll(async () => {
    securableModel = suite.data.system[type];
    securable = { securableId: securableModel.id, securableType: type };

    url = `${baseUrl}/${securableModel.id}/media`;

    filePath = suite.files.images.jpg;
    output = {
      name: 'media_001',
      modelId: securableModel.id,
      modelType: type,
      disk: 'public',
      filename: 'media_001.jpg',
      collection: 'tinymce',
    };

    await suite.util.setPermission([]);
    await suite.util.setSecurable({ ...securable, action: [] });
    await securableModel.update({ ownerId: null });
  });

  it('missing authentication', async () => {
    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .field('name', output.name)
      .field('disk', output.disk)
      .field('collection', output.collection)
      .attach('file', createReadStream(filePath), output.filename);

    expect(status).toBe(401);
  });

  it('missing authorization', async () => {
    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .field('name', output.name)
      .field('disk', output.disk)
      .field('collection', output.collection)
      .attach('file', createReadStream(filePath), output.filename);

    expect(status).toBe(403);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['disk', 'collection']);
    });

    it('should return 400 for invalid input data', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('id', 'not-an-uuid')
        .field('name', 'a'.repeat(129))
        .field('disk', 'not-a-disk')
        .field('collection', '');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['id', 'name', 'disk', 'collection']);
    });

    it('should return 400 for invalid input file', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('disk', output.disk)
        .field('collection', output.collection)
        .field('file', 'not-a-file');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['file']);
    });

    /* it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    }); */
  });

  /* describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([resource]);
    });

    it('should return 403 for missing securable', async () => {
      await suite.util.setSecurable(securable);

      const { status } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(403);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['media'] });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await securableModel.update({ ownerId: suite.data.system.user.id });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });
  }); */
};
