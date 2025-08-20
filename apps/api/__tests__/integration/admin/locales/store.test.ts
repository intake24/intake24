import { suite } from '@intake24/api-tests/integration/helpers';
import type { SystemLocaleCreationAttributes } from '@intake24/db';

export default () => {
  const url = '/api/admin/locales';
  const permissions = ['locales', 'locales:create'];

  let input: SystemLocaleCreationAttributes;
  let output: SystemLocaleCreationAttributes;

  beforeAll(async () => {
    const { code } = suite.data.system.Language;
    input = {
      code: 'en-cb',
      englishName: 'English - Caribbean',
      localName: 'English - Caribbean',
      respondentLanguageId: code,
      adminLanguageId: code,
      countryFlagCode: 'en-cb',
      prototypeLocaleId: null,
      textDirection: 'ltr',
      foodIndexEnabled: true,
      foodIndexLanguageBackendId: 'en',
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
        'respondentLanguageId',
        'adminLanguageId',
        'countryFlagCode',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        [
          'code',
          'englishName',
          'localName',
          'respondentLanguageId',
          'adminLanguageId',
          'countryFlagCode',
          'prototypeLocaleId',
          'textDirection',
          'foodIndexEnabled',
          'foodIndexLanguageBackendId',
          'visibility',
        ],
        {
          input: {
            code: null,
            englishName: [],
            localName: ['dddsds', 'dffd'],
            respondentLanguageId: ['nonLocaleString'],
            adminLanguageId: 5,
            countryFlagCode: 5,
            prototypeLocaleId: 'nonExistingLocale',
            textDirection: 'wrongDirection',
            foodIndexEnabled: 'notABoolean',
            foodIndexLanguageBackendId: 5,
            visibility: 10,
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 409 for duplicate id', async () => {
      const { code } = suite.data.system.Language;

      await suite.sharedTests.assertInvalidInput('post', url, ['code'], {
        input: {
          code: input.code,
          englishName: 'English - India',
          localName: 'English - India',
          respondentLanguageId: code,
          adminLanguageId: code,
          countryFlagCode: 'en-in',
          prototypeLocaleId: null,
          textDirection: 'ltr',
          visibility: 'public',
        },
        code: 409,
      });
    });
  });
};
