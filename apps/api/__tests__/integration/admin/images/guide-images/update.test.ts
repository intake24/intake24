import type { GuideImageEntry } from '@intake24/common/types/http/admin';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/guide-images';
  const permissions = ['guide-images', 'guide-images:edit'];

  const input = {
    id: 'guideImage_004',
    description: 'guideImage_004_description',
    imageMapId: 'imageMapForGuide',
    label: { en: 'guideImage_004_label' },
  };

  const updateInput = {
    description: 'updated_guideImage_004_description',
    label: { en: 'updated_guideImage_004_label' },
    objects: [
      {
        id: '0',
        description: 'obj_description_0',
        label: { en: 'obj_label_01' },
        navigationIndex: 1,
        outlineCoordinates: [1, 2, 3, 4, 5, 6],
        weight: 10,
      },
      {
        id: '1',
        description: 'obj_description_1',
        label: { en: 'obj_label_11' },
        navigationIndex: 2,
        outlineCoordinates: [7, 8, 9, 10, 11, 12],
        weight: 20,
      },
    ],
  };

  let output: GuideImageEntry;

  const url = `${baseUrl}/${input.id}`;
  const invalidUrl = `${baseUrl}/999999`;

  beforeAll(async () => {
    await request(suite.app)
      .put(`/api/admin/images/image-maps/imageMapForGuide`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send({
        description: 'imageMapForGuide',
        label: { en: 'imageMapForGuide' },
        objects: [
          {
            id: '0',
            description: 'obj_description_0',
            label: { en: 'obj_label_0' },
            navigationIndex: 1,
            outlineCoordinates: [1, 2, 3, 4, 5, 6],
          },
          {
            id: '1',
            description: 'obj_description_1',
            label: { en: 'obj_label_1' },
            navigationIndex: 2,
            outlineCoordinates: [7, 8, 9, 10, 11, 12],
          },
        ],
      });

    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send(input);

    output = { ...body, ...updateInput };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'objects']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'label', 'objects'], {
        input: {
          description: ['invalid description'],
          label: 'invalid label',
          objects: 'notValidObjects',
        },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, output, { input: updateInput });
    });
  });
};
