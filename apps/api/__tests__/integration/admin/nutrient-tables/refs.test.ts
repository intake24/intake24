import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { NutrientTable } from '@intake24/db';

export default () => {
  const url = '/api/admin/nutrient-tables/refs';
  const permissions = ['nutrient-tables:browse'];

  beforeAll(async () => {
    const input = mocker.foods.nutrientTable();
    await NutrientTable.create(input, {
      include: [
        { association: 'csvMapping' },
        { association: 'csvMappingFields' },
        { association: 'csvMappingNutrients' },
      ],
    });
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  it('should return 200 and refs', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertReferencesResult('get', url, ['nutrientTypes']);
  });
};
