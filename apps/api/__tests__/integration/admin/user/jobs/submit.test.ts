import type { UserJobRequest } from '@intake24/common/types/http/admin';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user/jobs';
  const permissions = ['as-served-sets:browse'];

  const input: UserJobRequest = {
    type: 'ResourceExport',
    params: {
      resource: 'as-served-sets',
    },
  };

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url);
  });

  describe('authenticated / resource authorized', () => {
    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['type', 'params']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['type', 'params'],
        {
          input: {
            type: 'not-a-job-type',
            params: 'invalid-params',
          },
        },
      );
    });

    it('should return 403 when missing permissions', async () => {
      await suite.sharedTests.assertMissingAuthorization('post', url, { input });
    });

    it('should return 200 and data', async () => {
      await suite.util.setPermission(permissions);
      await suite.sharedTests.assertAcknowledged('post', url, { input, result: true });
    });
  });
};
