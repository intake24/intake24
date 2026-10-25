import type { AuditTablesRequest, AuditTablesResponse } from '@intake24/common/types/http/admin';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/audit/tables';
  const permissions = ['audit'];

  let input: AuditTablesRequest;
  let output: AuditTablesResponse;

  beforeAll(async () => {
    input = {
      foods: [
        { id: 'categories', exclude: ['id'] },
        { id: 'standard_units', exclude: ['id'] },
      ],
      system: [
        { id: 'permissions', exclude: ['id'] },
        { id: 'users', exclude: ['id'] },
      ],
    };
    output = input;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        [
          'foods',
          'system',
        ],
        {
          input: {
            foods: { id: 'categories', exclude: ['id'] },
            system: [
              { id: 'permissions', exclude: ['id'] },
              { id: 'users', exclude: ['id'] },
              { id: 'users', exclude: ['id'] },
            ],
          },
        },
      );
    });

    it('should return 200', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(200);
      expect(body).toEqual(output);
    });
  });
};
