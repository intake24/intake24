import type { PermissionRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Permission } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/permissions';
  const permissions = ['acl', 'permissions', 'permissions:users'];

  let url: string;
  let invalidUrl: string;

  let input: PermissionRequest;
  let permission: Permission;

  beforeAll(async () => {
    input = mocker.system.permission();
    permission = await Permission.create(input);

    url = `${baseUrl}/${permission.id}/users`;
    invalidUrl = `${baseUrl}/999999/users`;
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
      await suite.sharedTests.assertPaginatedResult('get', url);
    });
  });
};
