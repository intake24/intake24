import type { StandardUnitCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:standard-units'];

  let url: string;

  let input: StandardUnitCreationAttributes;
  let output: StandardUnitCreationAttributes;

  beforeAll(async () => {
    const { id, code: localeId } = suite.data.system.Locale;

    input = mocker.foods.standardUnit(localeId);
    output = { ...input };

    url = `${baseUrl}/${id}/standard-units`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, [
        'code',
        'name',
        'estimateIn',
        'howMany',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['code', 'name', 'estimateIn.en', 'howMany', 'icon'],
        {
          input: {
            code: { value: 'should be string' },
            name: ['should be string'],
            estimateIn: { en: { value: 'test' } },
            howMany: 'ten',
            icon: { value: 'should be string' },
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate id', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['code'], { input });
    });
  });
};
