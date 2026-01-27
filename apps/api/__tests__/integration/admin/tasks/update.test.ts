import type { TaskRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Task } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/tasks';
  const permissions = ['tasks', 'tasks:edit'];

  let url: string;
  let invalidUrl: string;

  let input: TaskRequest;
  let updateInput: TaskRequest;
  let task: Task;

  beforeAll(async () => {
    input = mocker.system.task();
    updateInput = mocker.system.task();

    task = await Task.create(input);

    url = `${baseUrl}/${task.id}`;
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
      await suite.sharedTests.assertInvalidInput('put', url, [
        'name',
        'job',
        'cron',
        'active',
        'params',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        ['name', 'job', 'cron', 'active', 'description', 'params'],
        {
          input: {
            name: null,
            job: true,
            cron: false,
            active: 'not-a-boolean',
            description: ['should just be string', 'should just be string'],
            params: ['invalidObject'],
          },
        },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, updateInput, { input: updateInput });
    });
  });
};
