import type { SurveySchemeCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:delete'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemeCreationAttributes;
  let scheme: SurveyScheme;

  beforeAll(async () => {
    input = mocker.system.surveyScheme();
    scheme = await SurveyScheme.create(input);

    url = `${baseUrl}/${scheme.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['survey-schemes']);
    });

    it('should return 204 and no content when securable set', async () => {
      const { id } = await SurveyScheme.create(mocker.system.surveyScheme());
      await suite.util.setSecurable({
        securableId: id,
        securableType: 'SurveyScheme',
        action: ['delete'],
      });

      await suite.sharedTests.assertRecordDeleted('delete', `${baseUrl}/${id}`);
    });

    it('should return 204 and no content when owner set', async () => {
      const { id } = await SurveyScheme.create({
        ...mocker.system.surveyScheme(),
        ownerId: suite.data.system.user.id,
      });

      await suite.sharedTests.assertRecordDeleted('delete', `${baseUrl}/${id}`);
    });
  });
};
