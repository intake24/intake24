import { omit, pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { CustomField } from '@intake24/common/types';
import type { UserInput, UserRequest } from '@intake24/common/types/http/admin';

export default () => {
  const url = '/api/admin/users';
  const permissions = ['acl', 'users', 'users:create'];

  let input: UserRequest;
  let output: Omit<UserInput, 'permissions' | 'roles'>;

  beforeAll(async () => {
    input = mocker.system.user();
    output = {
      ...omit(input, ['password', 'passwordConfirm', 'permissions', 'roles']),
      email: input.email?.toLocaleLowerCase(),
    };
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
          'email',
          'password',
          'passwordConfirm',
          'multiFactorAuthentication',
          'emailNotifications',
          'smsNotifications',
          'customFields',
          'permissions.0',
          'permissions.1',
          'permissions.2',
          'roles.0',
          'roles.1',
          'roles.2',
          'disabledAt',
          'verifiedAt',
        ],
        {
          input: {
            email: 'invalidEmailFormat',
            password: 'weak-pass',
            passwordConfirm: 'not-matching',
            multiFactorAuthentication: 10,
            emailNotifications: 'string',
            smsNotifications: [100],
            customFields: 'invalidCustomFields',
            permissions: [1, 'invalidId', 2],
            roles: [1, 'invalidId', 2],
            disabledAt: { invalid: new Date() },
            verifiedAt: 'invalidDate',
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

      expect(status).toBe(201);

      // Extract custom fields for non-order specific comparison
      const { customFields: resCustomFields, ...data } = body;
      const { customFields: outputCustomFields, ...restOutput } = output;

      // 1) match the output
      expect(pick(data, Object.keys(restOutput))).toEqual(restOutput);

      // 2) non-order specific custom field comparison
      if (outputCustomFields) {
        const fields: CustomField[] = resCustomFields.map((field: CustomField) => pick(field, ['name', 'value', 'public']));
        expect(fields).toIncludeSameMembers(outputCustomFields);
      }
    });

    it('should return 400 for duplicate email', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['email'], {
        input: { ...mocker.system.user(), email: input.email },
      });
    });
  });
};
