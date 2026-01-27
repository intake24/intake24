import type { PermissionRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Permission } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/permissions';
  const permissions = ['acl', 'permissions', 'permissions:edit'];

  let url: string;
  let invalidUrl: string;

  let input: PermissionRequest;
  let updateInput: PermissionRequest;
  let output: PermissionRequest;
  let permission: Permission;

  beforeAll(async () => {
    input = mocker.system.permission();
    updateInput = mocker.system.permission();

    const { name } = input;
    output = { ...updateInput, name };

    permission = await Permission.create(input);

    url = `${baseUrl}/${permission.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['displayName']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['displayName', 'description'], {
        input: { displayName: '', description: {} },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, output, { input: updateInput });
    });
  });
};
