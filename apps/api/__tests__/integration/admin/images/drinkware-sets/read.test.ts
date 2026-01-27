import type { DrinkwareSetResponse } from '@intake24/common/types/http';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/images/drinkware-sets';
  const permissions = ['drinkware-sets', 'drinkware-sets:read'];

  const input = {
    id: 'drinkwareSet_002',
    description: 'drinkwareSet_002_description',
    label: { en: 'drinkwareSet_002_label' },
    imageMapId: 'imageMapForDrinkwareSet',
  };

  let output: DrinkwareSetResponse;

  const url = `${baseUrl}/${input.id}`;
  const invalidUrl = `${baseUrl}/999999`;

  beforeAll(async () => {
    const { body } = await request(suite.app)
      .post(baseUrl)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send(input);

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
