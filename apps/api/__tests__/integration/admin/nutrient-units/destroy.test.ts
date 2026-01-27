import type { NutrientUnitRequest } from '@intake24/common/types/http/admin';
import type { FoodsNutrientUnit } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/nutrient-units';
  const permissions = ['nutrient-units', 'nutrient-units:delete'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientUnitRequest;
  let nutrientUnit: FoodsNutrientUnit;

  beforeAll(async () => {
    input = mocker.foods.nutrientUnit();
    nutrientUnit = await ioc.cradle.nutrientUnitService.createNutrientUnit(input);

    url = `${baseUrl}/${nutrientUnit.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });
};
