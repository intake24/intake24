import type { RoleRequest } from '@intake24/common/types/http/admin';

import { pick, times } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Permission, Role } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/roles';
  const permissions = ['acl', 'roles:edit'];

  let url: string;
  let invalidUrl: string;

  let input: RoleRequest;
  let updateInput: RoleRequest;
  let output: RoleRequest;
  let role: Role;
  let grantedPermissions: string[];

  beforeAll(async () => {
    input = mocker.system.role();
    updateInput = mocker.system.role();

    const permissionInput = times(3, () => mocker.system.permission());
    const permissionsRecords = await Permission.bulkCreate(permissionInput);
    updateInput.permissions = permissionsRecords.map((item: Permission) => item.id);
    grantedPermissions = permissionsRecords.map((item: Permission) => item.name);

    const { name } = input;
    output = { ...updateInput, name };

    role = await Role.create(input);

    url = `${baseUrl}/${role.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([
        ...permissions,
        ...grantedPermissions,
      ]);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, [
        'displayName',
        'permissions',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        ['displayName', 'description', 'permissions.1'],
        {
          input: {
            displayName: '',
            description: [],
            permissions: [1, 'invalidId', 2],
          },
        },
      );
    });

    it('should return 400 for non-existent permissions', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['permissions'], {
        input: {
          ...updateInput,
          permissions: ['999999'],
        },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(updateInput);

      expect(status).toBe(200);

      const data = {
        ...body,
        permissions: body.permissions.map((item: Permission) => item.id),
      };

      expect(pick(data, Object.keys(output))).toEqual(output);
    });

    describe('privilege escalation', () => {
      let unheldPermission: Permission;

      beforeAll(async () => {
        unheldPermission = await Permission.create(mocker.system.permission());
      });

      it('should return 403 when granting permission the caller does not hold', async () => {
        await suite.sharedTests.assertMissingAuthorization('put', url, {
          input: {
            ...updateInput,
            permissions: [...updateInput.permissions, unheldPermission.id],
          },
        });
      });

      it('should return 403 when revoking permission the caller does not hold', async () => {
        const privilegedRole = await Role.create(mocker.system.role());
        await privilegedRole.$set('permissions', [unheldPermission]);

        await suite.sharedTests.assertMissingAuthorization('put', `${baseUrl}/${privilegedRole.id}`, {
          input: { ...updateInput, permissions: [] },
        });
      });

      it('should return 200 when keeping permission the caller does not hold', async () => {
        const privilegedRole = await Role.create(mocker.system.role());
        await privilegedRole.$set('permissions', [unheldPermission]);

        const { status, body } = await request(suite.app)
          .put(`${baseUrl}/${privilegedRole.id}`)
          .set('Accept', 'application/json')
          .set('Authorization', suite.bearer.user)
          .send({
            ...updateInput,
            permissions: [unheldPermission.id],
          });

        expect(status).toBe(200);
        expect(body.displayName).toBe(updateInput.displayName);
        expect(body.permissions.map((item: Permission) => item.id)).toEqual([unheldPermission.id]);
      });

      it('should return 403 when non-superuser edits superuser role', async () => {
        const superuserRole = await Role.create({
          ...mocker.system.role(),
          name: ioc.cradle.aclConfig.roles.superuser,
        });

        try {
          await suite.sharedTests.assertMissingAuthorization('put', `${baseUrl}/${superuserRole.id}`, {
            input: updateInput,
          });
        }
        finally {
          await superuserRole.destroy();
        }
      });
    });
  });
};
