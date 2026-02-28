import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { MediaEntry, MediaModel } from '@intake24/common/types/http/admin';
import type { BaseModel } from '@intake24/db';

import { createReadStream } from 'node:fs';

import { camelCase, pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { modelToResource } from '@intake24/common/util';
import { models } from '@intake24/db';

export default (type: MediaModel) => () => {
  const resource = modelToResource(type);
  const baseUrl = `/api/admin/${resource}`;
  const permissions = [resource, `${resource}:media`];

  let url: string;
  let model: BaseModel;
  let securable: SetSecurableOptions;

  let filePath: string;
  let output: Omit<MediaEntry, 'id' | 'mimetype' | 'size' | 'createdAt' | 'updatedAt' | 'url' | 'sizes'>;

  beforeAll(async () => {
    // @ts-expect-error not typed
    const modelInput = mocker.system[camelCase(type)]();
    // @ts-expect-error not typed
    model = await models.system[type].create(modelInput);

    securable = { securableId: model.id, securableType: type };

    url = `${baseUrl}/${model.id}/media`;

    filePath = suite.files.images.jpg;
    output = {
      name: 'media_001',
      modelId: model.id,
      modelType: type,
      disk: 'public',
      filename: 'media_001.jpg',
      collection: 'tinymce',
    };
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

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('disk', output.disk)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([resource]);
    });

    it('should return 403 for missing securable', async () => {
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

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['media'] });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('disk', output.disk)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await model.update({ ownerId: suite.data.system.user.id });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('name', output.name)
        .field('disk', output.disk)
        .field('collection', output.collection)
        .attach('file', createReadStream(filePath), output.filename);

      expect(status).toBe(201);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });
  });
};
