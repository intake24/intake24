import type { StandardUnitCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { StandardUnit } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:standard-units'];

  let url: string;
  let invalidUrl: string;

  let input: StandardUnitCreationAttributes;
  let updateInput: StandardUnitCreationAttributes;
  let standardUnit: StandardUnit;

  beforeAll(async () => {
    const { id, code: localeId } = suite.data.system.Locale;
    input = mocker.foods.standardUnit(localeId);
    updateInput = mocker.foods.standardUnit(localeId);

    standardUnit = await StandardUnit.create(input);

    url = `${baseUrl}/${id}/standard-units/${standardUnit.id}`;
    invalidUrl = `${baseUrl}/${id}/standard-units/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['code', 'name', 'estimateIn', 'howMany']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['code', 'name', 'estimateIn.en', 'howMany', 'icon'], {
        input: { code: false, name: null, estimateIn: { en: ['text'] }, howMany: 10, icon: true },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, updateInput);
    });
  });
};
