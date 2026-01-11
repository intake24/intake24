import { createReadStream } from 'node:fs';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { DrinkwareSetResponse } from '@intake24/common/types/http';

export default () => {
  const url = '/api/admin/images/drinkware-sets?return=true';
  const permissions = ['drinkware-sets', 'drinkware-sets:create'];

  const input = {
    id: 'drinkwareSet_001',
    description: 'drinkwareSet_001_description',
    label: { en: 'drinkwareSet_001_label' },
    imageMapId: 'imageMapForDrinkwareSet',
  };

  let output: Omit<DrinkwareSetResponse, 'imageUrl'>;

  beforeAll(async () => {
    await request(suite.app)
      .post('/api/admin/images/image-maps')
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .field('id', 'imageMapForDrinkwareSet')
      .field('description', 'imageMapForDrinkwareSet')
      .field('label[en]', 'imageMapForDrinkwareSet')
      .attach(
        'baseImage',
        createReadStream(suite.files.images.jpg),
        'imageMapForDrinkwareSet.jpg',
      );

    output = { ...input, scales: [] };
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
          id: './drinkwareSet_001',
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
      await suite.sharedTests.assertConflict('post', url, { input });
    });
  });
};
