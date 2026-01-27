import type { SurveySchemeCreationAttributes } from '@intake24/db';

import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SurveyScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:prompts'];

  let url: string;
  let invalidUrl: string;

  let input: SurveySchemeCreationAttributes;
  let scheme: SurveyScheme;

  beforeAll(async () => {
    input = mocker.system.surveyScheme();
    scheme = await SurveyScheme.create(input);

    url = `${baseUrl}/${scheme.id}/templates`;
    invalidUrl = `${baseUrl}/999999/templates`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for invalid query input data (#1)', async () => {
      const { status, body } = await request(suite.app)
        .get(`${url}?limit=not-a-number`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user);

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['limit']);
    });

    it('should return 400 for invalid query input data (#2)', async () => {
      const { status, body } = await request(suite.app)
        .get(`${url}?limit=-1`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user);

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['limit']);
    });

    it('should return 400 for invalid query input data (#3)', async () => {
      const { status, body } = await request(suite.app)
        .get(`${url}?limit=9999`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user);

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['limit']);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and empty paginated results', async () => {
      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });
};
