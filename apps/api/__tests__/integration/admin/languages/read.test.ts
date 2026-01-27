import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { LanguageCreationAttributes } from '@intake24/db';

import { suite } from '@intake24/api-tests/integration/helpers';
import { Language } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/languages';
  const permissions = ['languages', 'languages:read'];

  let url: string;
  let invalidUrl: string;

  let input: LanguageCreationAttributes;
  let output: LanguageCreationAttributes;
  let language: Language;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = {
      code: 'es-cl',
      englishName: 'Spanish - Chile',
      localName: 'Spanish - Chile',
      countryFlagCode: 'es-cl',
      textDirection: 'ltr',
      visibility: 'public',
    };
    language = await Language.create(input);
    output = { ...input };

    securable = { securableId: language.id, securableType: 'Language' };

    url = `${baseUrl}/${language.id}`;
    invalidUrl = `${baseUrl}/999999`;
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
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['languages']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['read'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await language.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
