import type { CustomField } from '@intake24/common/types';
import type { UserInput, UserRequest } from '@intake24/common/types/http/admin';
import type { User } from '@intake24/db';

import { omit, pick, times } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Permission, Role } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/users';
  const permissions = ['acl', 'users', 'users:edit'];

  let url: string;
  let invalidUrl: string;

  let input: UserRequest;
  let updateInput: Omit<UserInput, 'password'>;
  let user: User;

  beforeAll(async () => {
    input = mocker.system.user();
    const updateUser = omit(mocker.system.user(), ['password', 'passwordConfirm']);
    updateInput = {
      ...updateUser,
      email: updateUser.email?.toLocaleLowerCase(),
    };

    const permissionInput = times(3, () => mocker.system.permission());
    const permissionsRecords = await Permission.bulkCreate(permissionInput);
    updateInput.permissions = permissionsRecords.map(item => item.id);

    const roleInput = times(2, () => mocker.system.role());
    const roles = await Role.bulkCreate(roleInput);
    updateInput.roles = roles.map(item => item.id);

    user = await ioc.cradle.adminUserService.create(input);

    url = `${baseUrl}/${user.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        [
          'email',
          'multiFactorAuthentication',
          'emailNotifications',
          'smsNotifications',
          'customFields.0.value',
          'permissions.1',
          'roles.1',
          'disabledAt',
          'verifiedAt',
        ],
        {
          input: {
            email: 'invalidEmailFormat',
            multiFactorAuthentication: 10,
            emailNotifications: 'string',
            smsNotifications: [100],
            customFields: [{ name: 'fieldName', missingValueKey: false }],
            permissions: [1, 'invalidId', 2],
            roles: [1, 'invalidId', 2],
            disabledAt: 'invalidDate',
            verifiedAt: [false],
          },
        },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and accept same email', async () => {
      const { email } = input;

      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({ email, permissions: [], roles: [] });

      expect(status).toBe(200);
      expect(body.email).toBe(email?.toLocaleLowerCase());
    });

    it('should return 200 and data', async () => {
      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(updateInput);

      expect(status).toBe(200);

      // Extract custom fields, permissions, roles for non-order specific comparison
      const {
        customFields: resCustomFields,
        permissions: resPermissions,
        roles: resRoles,
        ...data
      } = body;

      const {
        customFields: outputCustomFields,
        permissions: outputPermissions,
        roles: outputRoles,
        ...restUpdateInput
      } = updateInput;

      // 1) match the output
      expect(pick(data, Object.keys(restUpdateInput))).toEqual(restUpdateInput);

      // 2) non-order specific comparison
      if (outputCustomFields) {
        const fields = resCustomFields.map((field: CustomField) => pick(field, ['name', 'value', 'public']));
        expect(fields).toIncludeSameMembers(outputCustomFields);
      }

      expect(resPermissions.map((item: Permission) => item.id)).toEqual(outputPermissions);
      expect(resRoles.map((item: Role) => item.id)).toEqual(outputRoles);
    });
  });
};
