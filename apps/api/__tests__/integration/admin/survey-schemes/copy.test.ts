import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { SurveySchemeCreationAttributes } from '@intake24/db';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:copy'];

  let url: string;
  let invalidUrl: string;

  let input: Pick<SurveySchemeCreationAttributes, 'name'>;
  let output: SurveySchemeCreationAttributes;
  let surveyScheme: SurveyScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const inputScheme = mocker.system.surveyScheme();

    const { name } = mocker.system.surveyScheme();
    input = { name };
    output = { ...inputScheme, name };

    surveyScheme = await SurveyScheme.create(inputScheme);

    securable = { securableId: surveyScheme.id, securableType: 'SurveyScheme' };

    url = `${baseUrl}/${surveyScheme.id}/copy`;
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
      const { name } = surveyScheme;

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
      await suite.util.setPermission(['survey-schemes']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['copy'] });
      const { name } = mocker.system.surveyScheme();

      await suite.sharedTests.assertRecordUpdated('post', url, { name });
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await surveyScheme.update({ ownerId: suite.data.system.user.id });

      const { name } = mocker.system.surveyScheme();

      await suite.sharedTests.assertRecordUpdated('post', url, { name });
    });
  });
};
