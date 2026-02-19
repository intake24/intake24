import type { FoodBuilderRequest } from '@intake24/common/types/http/admin';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:food-builders'];

  let url: string;
  // let invalidUrl: string;

  let foodBuilders: FoodBuilderRequest[];

  beforeAll(async () => {
    const { id, code: localeId } = suite.data.system.Locale;

    foodBuilders = [
      {
        localeId,
        code: 'RF-TST-1',
        type: 'recipe',
        name: 'recipe-food-test1',
        triggerWord: 'test-food-1',
        synonymSetId: null,
        steps: [],
      },
      {
        localeId,
        code: 'RF-TST-2',
        name: 'recipe-food-test2',
        type: 'recipe',
        triggerWord: 'test-food-2',
        synonymSetId: null,
        steps: [],
      },
    ];

    await ioc.cradle.localeService.setFoodBuilders(localeId, foodBuilders);

    url = `${baseUrl}/${id}/food-builders`;
    // invalidUrl = `${baseUrl}/999999/food-builders`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  // describe('authenticated / resource authorized', () => {
  //   beforeAll(async () => {
  //     await suite.util.setPermission(permissions);
  //   });

  //   it(`should return 404 when record doesn't exist`, async () => {
  //     await suite.sharedTests.assertMissingRecord('get', invalidUrl);
  //   });

  //   it('should return 200 and records', async () => {
  //     await suite.util.setPermission(permissions);

  //     const { status, body } = await request(suite.app)
  //       .get(url)
  //       .set('Accept', 'application/json')
  //       .set('Authorization', suite.bearer.user)
  //       .send();

  //     expect(status).toBe(200);
  //     expect(body).toBeArray();

  //     const lists = body.map(({ id, ...rest }: RecipeFoodRequest) => rest);
  //     expect(lists).toIncludeSameMembers(recipeFoods);
  //   });
  // });
};
