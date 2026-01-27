import type { NutrientTypeRequest } from '@intake24/common/types/http/admin';
import type { FoodsNutrientType } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/nutrient-types';
  const permissions = ['nutrient-types', 'nutrient-types:edit'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientTypeRequest;
  let updateInput: NutrientTypeRequest;
  let output: NutrientTypeRequest;
  let nutrientType: FoodsNutrientType;

  beforeAll(async () => {
    input = mocker.foods.nutrientType('1', 48.7);
    updateInput = mocker.foods.nutrientType('2', null);

    const { id } = input;
    const { kcalPerUnit, ...rest } = updateInput;
    output = { ...rest, id };

    nutrientType = await ioc.cradle.nutrientTypeService.createNutrientType(input);

    url = `${baseUrl}/${nutrientType.id}`;
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
      await suite.sharedTests.assertInvalidInput('put', url, ['description', 'unitId']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        ['description', 'unitId', 'kcalPerUnit'],
        { input: { description: { name: 'text' }, unitId: null, kcalPerUnit: { value: [10] } } },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, output, { input: updateInput });
    });
  });
};
