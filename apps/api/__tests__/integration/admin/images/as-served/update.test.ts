import { createReadStream } from 'node:fs';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { AsServedSetEntry } from '@intake24/common/types/http/admin';

export default () => {
  const baseUrl = '/api/admin/images/as-served-sets';
  const permissions = ['as-served-sets', 'as-served-sets:edit'];

  const fileName = 'asServedSet_004.jpg';
  const id = 'asServedSet_004';
  const description = 'asServedSet_004_description';
  const label = { en: 'asServedSet_004_label' };

  let updateInput: Omit<AsServedSetEntry, 'id' | 'selectionImageUrl'> = {
    description: 'updated_asServedSet_004_description',
    label: { en: 'updated_asServedSet_004_label' },
    images: [],
  };

  const url = `${baseUrl}/${id}`;
  const invalidUrl = `${baseUrl}/999999`;

  let output: AsServedSetEntry;

  beforeAll(async () => {
    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('id', id)
      .field('description', description)
      .field('label[en]', label.en)
      .attach('selectionImage', createReadStream(suite.files.images.jpg), fileName);

    const images = [];
    for (const weight of [50, 100, 150]) {
      const { body: image } = await request(suite.app)
        .post(`${url}/images`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.superuser)
        .field('label[en]', `asServedImage_${weight}_label`)
        .field('weight', 10)
        .attach('image', createReadStream(suite.files.images.jpg), fileName);

      images.push({ ...image, weight });
    }

    updateInput = { ...updateInput, images };
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
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'images']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'images', 'label'], {
        input: {
          description: ['invalid description'],
          images: 'notValidObjects',
          label: 'invalid label',
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
