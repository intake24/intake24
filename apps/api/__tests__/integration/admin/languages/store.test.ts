import type { LanguageCreationAttributes } from '@intake24/db';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/languages';
  const permissions = ['languages', 'languages:create'];

  let input: LanguageCreationAttributes;
  let output: LanguageCreationAttributes;

  beforeAll(async () => {
    input = {
      code: 'es-cr',
      englishName: 'Spanish - Costa Rica',
      localName: 'Spanish - Costa Rica',
      countryFlagCode: 'es-cr',
      textDirection: 'ltr',
      visibility: 'public',
    };
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
      await suite.sharedTests.assertInvalidInput('post', url, [
        'code',
        'englishName',
        'localName',
        'countryFlagCode',
        'textDirection',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['code', 'englishName', 'localName', 'countryFlagCode', 'textDirection', 'visibility'],
        {
          input: {
            id: null,
            englishName: { key: 'name' },
            localName: ['dddsds', 'dffd'],
            countryFlagCode: 10,
            textDirection: 'wrongDirection',
            visibility: false,
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate id', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['code'], {
        input: {
          code: input.code,
          englishName: 'Spanish - Dominican Republic',
          localName: 'Spanish - Dominican Republic',
          countryFlagCode: 'es-do',
          textDirection: 'ltr',
        },
      });
    });
  });
};
