import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { FeedbackSchemeCreationAttributes } from '@intake24/db';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FeedbackScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/feedback-schemes';
  const permissions = ['feedback-schemes', 'feedback-schemes:copy'];

  let url: string;
  let invalidUrl: string;

  let input: Pick<FeedbackSchemeCreationAttributes, 'name'>;
  let output: FeedbackSchemeCreationAttributes;
  let feedbackScheme: FeedbackScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const inputScheme = mocker.system.feedbackScheme();

    const { name } = mocker.system.feedbackScheme();
    input = { name };
    output = { ...inputScheme, name };

    feedbackScheme = await FeedbackScheme.create(inputScheme);

    securable = { securableId: feedbackScheme.id, securableType: 'FeedbackScheme' };

    url = `${baseUrl}/${feedbackScheme.id}/copy`;
    invalidUrl = `${baseUrl}/999999/copy`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], {
        input: { name: { name: 'objectName' } },
      });
    });

    it('should return 400 for same id/name provided', async () => {
      const { name } = feedbackScheme;

      await suite.sharedTests.assertInvalidInput('post', url, ['name'], { input: { name } });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, { input });
    });

    it('should return 200 and data', async () => {
      const { name } = output;

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({ name });

      expect(status).toBe(200);
      expect(body.ownerId).toBe(suite.data.system.user.id);
      expect(pick(body, Object.keys(output))).toEqual(output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['feedback-schemes']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['copy'] });
      const { name } = mocker.system.feedbackScheme();

      await suite.sharedTests.assertRecordUpdated('post', url, { name });
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await feedbackScheme.update({ ownerId: suite.data.system.user.id });

      const { name } = mocker.system.feedbackScheme();

      await suite.sharedTests.assertRecordUpdated('post', url, { name });
    });
  });
};
