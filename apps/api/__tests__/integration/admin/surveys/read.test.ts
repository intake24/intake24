import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyEntry } from '@intake24/common/types/http/admin';
import type { SurveyCreationAttributes } from '@intake24/db';
import { Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:read'];

  let url: string;
  let invalidUrl: string;

  let input: SurveyCreationAttributes;
  let output: Partial<SurveyEntry>;
  let survey: Survey;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.survey();
    survey = await Survey.create(input);
    input = { ...input };
    output = { ...input, startDate: input.startDate.toISOString(), endDate: input.endDate.toISOString() };

    securable = { securableId: survey.id, securableType: 'Survey' };

    url = `${baseUrl}/${survey.id}`;
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
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['read'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
