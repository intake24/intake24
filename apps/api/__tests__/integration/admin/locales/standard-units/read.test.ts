import type { StandardUnitCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { StandardUnit } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:standard-units'];

  let url: string;
  let invalidUrl: string;

  let input: StandardUnitCreationAttributes;
  let standardUnit: StandardUnit;

  beforeAll(async () => {
    const { id, code: localeId } = suite.data.system.Locale;

    input = mocker.foods.standardUnit(localeId);
    standardUnit = await StandardUnit.create(input);

    url = `${baseUrl}/${id}/standard-units/${standardUnit.id}`;
    invalidUrl = `${baseUrl}/${id}/standard-units/999999`;
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
