import type { SurveySchemeCreationAttributes } from '@intake24/db';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/survey-schemes';
  const permissions = ['survey-schemes', 'survey-schemes:create'];

  let input: SurveySchemeCreationAttributes;
  let output: SurveySchemeCreationAttributes;

  beforeAll(async () => {
    input = mocker.system.surveyScheme();
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
      await suite.sharedTests.assertInvalidInput('post', url, ['name']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        [
          'name',
          'settings.type',
          'settings.flow',
          'settings.recallDate',
          'settings.languages',
          'settings.help.available',
          'settings.help.required',
          'visibility',
          'meals',
          'prompts',
          'dataExport',
        ],
        {
          input: {
            name: [],
            settings: {
              type: false,
              flow: '10-pass',
              recallDate: new Date().toISOString(),
              languages: 'not-a-locale',
              help: {
                available: 'a',
                required: false,
              },
            },
            visibility: [],
            meals: 5,
            prompts: [],
            dataExport: 'notExportScheme',
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(pick(body, Object.keys(output))).toEqual(output);
      expect(body.ownerId).toBe(suite.data.system.user.id);
      expect(status).toBe(201);
    });

    it('should return 400 for duplicate name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], {
        input: { ...mocker.system.surveyScheme(), name: input.name },
      });
    });
  });
};
