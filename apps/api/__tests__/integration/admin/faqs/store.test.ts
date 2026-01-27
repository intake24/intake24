import type { FAQRequest } from '@intake24/common/types/http/admin';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/faqs';
  const permissions = ['faqs', 'faqs:create'];

  let input: FAQRequest;
  let output: FAQRequest;

  beforeAll(async () => {
    input = mocker.system.faq();
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
      await suite.sharedTests.assertInvalidInput('post', url, ['name', 'content', 'visibility']);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: [],
        visibility: 1,
        content: [{
          test: [],
        }],
      };

      const fields = [
        'name',
        'visibility',
        'content.0.id',
        'content.0.title',
        'content.0.items',
      ];

      await suite.sharedTests.assertInvalidInput('post', url, fields, { input: invalidInput });
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
        input: { ...mocker.system.faq(), name: input.name },
      });
    });
  });
};
