import type { StandardUnitCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { StandardUnit } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/standard-units';
  const permissions = ['standard-units', 'standard-units:edit'];

  let url: string;
  let invalidUrl: string;

  let input: StandardUnitCreationAttributes;
  let updateInput: StandardUnitCreationAttributes;
  let output: StandardUnitCreationAttributes;
  let standardUnit: StandardUnit;

  beforeAll(async () => {
    input = mocker.foods.standardUnit();
    updateInput = mocker.foods.standardUnit();

    const { id } = input;
    output = { ...updateInput, id };

    standardUnit = await StandardUnit.create(input);

    url = `${baseUrl}/${standardUnit.id}`;
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
      await suite.sharedTests.assertInvalidInput('put', url, ['name', 'estimateIn', 'howMany']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['name', 'estimateIn.en', 'howMany'], {
        input: { name: null, estimateIn: { en: ['text'] }, howMany: 10 },
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
