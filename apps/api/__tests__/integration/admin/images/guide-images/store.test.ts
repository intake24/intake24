import type { GuideImageEntry } from '@intake24/common/types/http/admin';

import { createReadStream } from 'node:fs';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/images/guide-images';
  const permissions = ['guide-images', 'guide-images:create'];

  const input = {
    id: 'guideImage_001',
    description: 'guideImage_001_description',
    imageMapId: 'imageMapForGuide',
    label: { en: 'guideImage_001_label' },
  };

  let output: Omit<GuideImageEntry, 'baseImageUrl'>;

  beforeAll(async () => {
    await request(suite.app)
      .post('/api/admin/images/image-maps')
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('id', 'imageMapForGuide')
      .field('description', 'imageMapForGuide')
      .field('label[en]', 'imageMapForGuide')
      .attach('baseImage', createReadStream(suite.files.images.jpg), 'imageMapForGuide.jpg');

    output = { ...input, objects: [] };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description', 'imageMapId']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description', 'label'], {
        input: {
          id: './guideImage_001',
          imageMapId: input.imageMapId,
          description: { key: 'invalidDescription' },
          label: 'invalidLabel',
        },
      });
    });

    it('should return 400 for invalid input data (imageMapId)', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['imageMapId'], {
        input: { ...input, imageMapId: 'nonExistingImageMapId' },
      });
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 409 for duplicate id', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id'], { input, code: 409 });
    });
  });
};
