import type { NutrientUnitRequest } from '@intake24/common/types/http/admin';
import type { FoodsNutrientUnit } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/nutrient-units';
  const permissions = ['nutrient-units', 'nutrient-units:edit'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientUnitRequest;
  let updateInput: NutrientUnitRequest;
  let output: NutrientUnitRequest;
  let nutrientUnit: FoodsNutrientUnit;

  beforeAll(async () => {
    input = mocker.foods.nutrientUnit();
    updateInput = mocker.foods.nutrientUnit();

    const { id } = input;
    output = { ...updateInput, id };

    nutrientUnit = await ioc.cradle.nutrientUnitService.createNutrientUnit(input);

    url = `${baseUrl}/${nutrientUnit.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'symbol']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'symbol'], {
        input: { description: { name: 'text' }, symbol: null },
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
