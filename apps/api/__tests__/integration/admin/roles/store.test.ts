import type { RoleRequest } from '@intake24/common/types/http/admin';

import { omit } from 'lodash-es';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Permission } from '@intake24/db';

export default () => {
  const url = '/api/admin/roles';
  const permissions = ['acl', 'roles', 'roles:create'];

  let input: RoleRequest;
  let output: Omit<RoleRequest, 'permissions'>;

  beforeAll(async () => {
    input = mocker.system.role();
    output = omit(input, 'permissions');
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, [
        'name',
        'displayName',
        'permissions',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        [
          'name',
          'displayName',
          'description',
          'permissions.1',
        ],
        {
          input: {
            name: '',
            displayName: '',
            description: {},
            permissions: [1, 'invalidId', '2'],
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 403 when granting permission the caller does not hold', async () => {
      const unheldPermission = await Permission.create(mocker.system.permission());

      await suite.sharedTests.assertMissingAuthorization('post', url, {
        input: {
          ...mocker.system.role(),
          permissions: [unheldPermission.id],
        },
      });
    });

    it('should return 400 for non-existent permissions', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['permissions'], {
        input: {
          ...mocker.system.role(),
          permissions: ['999999'],
        },
      });
    });

    it('should return 400 for duplicate name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], { input });
    });
  });
};
