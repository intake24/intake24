import type { NutrientTypeRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/nutrient-types';
  const permissions = ['nutrient-types', 'nutrient-types:create'];

  let input: NutrientTypeRequest;
  let output: NutrientTypeRequest;

  beforeAll(async () => {
    input = mocker.foods.nutrientType('1');
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
      await suite.sharedTests.assertInvalidInput('post', url, ['id', 'description', 'unitId']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['id', 'description', 'unitId', 'kcalPerUnit'],
        {
          input: {
            id: 'not-a-number',
            description: false,
            unitId: ['1'],
            kcalPerUnit: 'not-a-number',
          },
        },
      );
    });

    it('should return 400 for invalid input data (unitId)', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['unitId'], {
        input: { ...input, unitId: '9999' },
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
