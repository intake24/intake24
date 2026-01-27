import type { NutrientUnitRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/nutrient-units';
  const permissions = ['nutrient-units', 'nutrient-units:create'];

  let input: NutrientUnitRequest;
  let output: NutrientUnitRequest;

  beforeAll(async () => {
    input = mocker.foods.nutrientUnit();
    output = { ...input };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description', 'symbol']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description', 'symbol'], {
        input: { id: 'not-a-number', description: false, symbol: ['g'] },
      });
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate id', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id'], { input });
    });
  });
};
