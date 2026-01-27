import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { SurveySchemeCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:read'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemeCreationAttributes;
  let output: SurveySchemeCreationAttributes;
  let scheme: SurveyScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.surveyScheme();
    scheme = await SurveyScheme.create(input);
    output = { ...input };

    securable = { securableId: scheme.id, securableType: 'SurveyScheme' };

    url = `${baseUrl}/${scheme.id}`;
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
      await suite.util.setPermission(['survey-schemes']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['read'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await scheme.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
