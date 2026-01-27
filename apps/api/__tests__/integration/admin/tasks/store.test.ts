import type { TaskRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/tasks';
  const permissions = ['tasks', 'tasks:create'];

  let input: TaskRequest;
  let output: TaskRequest;

  beforeAll(async () => {
    input = mocker.system.task();
    output = { ...input };
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
        'job',
        'cron',
        'active',
        'params',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['name', 'job', 'cron', 'active', 'description', 'params'],
        {
          input: {
            name: [0, 1],
            job: 'invalid-job',
            cron: 'invalid-cron-entry',
            active: 'not-a-boolean',
            description: { text: 'should just be string' },
            params: 1,
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await suite.sharedTests.assertRecordInserted('post', url, output, { input });
    });

    it('should return 400 for duplicate name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], { input });
    });
  });
};
