import type { NutrientTypeRequest } from '@intake24/common/types/http/admin';
import type { FoodsNutrientType } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/nutrient-types';
  const permissions = ['nutrient-types', 'nutrient-types:read'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientTypeRequest;
  let nutrientType: FoodsNutrientType;

  beforeAll(async () => {
    input = mocker.foods.nutrientType('1');
    nutrientType = await ioc.cradle.nutrientTypeService.createNutrientType(input);

    url = `${baseUrl}/${nutrientType.id}`;
    invalidUrl = `${baseUrl}/999999`;
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
      await suite.sharedTests.assertRecord('get', url, input);
    });
  });
};
