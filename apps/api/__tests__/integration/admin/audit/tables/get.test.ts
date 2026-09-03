import type { AuditTablesRequest, AuditTablesResponse } from '@intake24/common/types/http/admin';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/audit/tables';
  const permissions = ['audit'];

  let url: string;

  let input: AuditTablesRequest;
  let output: AuditTablesResponse;

  beforeAll(async () => {
    input = {
      foods: [
        { id: 'foods', exclude: ['id'] },
        { id: 'standard_units', exclude: ['id'] },
      ],
      system: [
        { id: 'roles', exclude: ['id'] },
        { id: 'users', exclude: ['id'] },
      ],
    };
    input = await ioc.cradle.auditService.saveAuditTables(input);
    output = input;

    url = `${baseUrl}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 200 and data', async () => {
      const { status, body } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user);

      expect(status).toBe(200);
      expect(body).toEqual(output);
    });
  });
};
