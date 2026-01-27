import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { FeedbackSchemeCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FeedbackScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/feedback-schemes';
  const permissions = ['feedback-schemes', 'feedback-schemes:read'];

  let url: string;
  let invalidUrl: string;

  let input: FeedbackSchemeCreationAttributes;
  let output: FeedbackSchemeCreationAttributes;
  let scheme: FeedbackScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.feedbackScheme();
    scheme = await FeedbackScheme.create(input);
    output = { ...input };

    securable = { securableId: scheme.id, securableType: 'FeedbackScheme' };

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
      await suite.util.setPermission(['feedback-schemes']);
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
