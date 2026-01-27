import type { CustomField } from '@intake24/common/types';
import type { UserInput, UserRequest } from '@intake24/common/types/http/admin';
import type { User } from '@intake24/db';

import { omit, pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/users';
  const permissions = ['acl', 'users', 'users:read'];

  let url: string;
  let invalidUrl: string;

  let input: UserRequest;
  let output: Omit<UserInput, 'password'>;
  let user: User;

  beforeAll(async () => {
    input = mocker.system.user();
    user = await ioc.cradle.adminUserService.create(input);
    output = omit(input, ['password', 'passwordConfirm']);

    url = `${baseUrl}/${user.id}`;
    invalidUrl = `${baseUrl}/999999`;
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
      const { status, body } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user);

      expect(status).toBe(200);

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
  });
};
