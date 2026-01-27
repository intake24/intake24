import type { TaskRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Task } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/tasks';
  const permissions = ['tasks', 'tasks:read'];

  let url: string;
  let invalidUrl: string;

  let input: TaskRequest;
  let output: TaskRequest;
  let task: Task;

  beforeAll(async () => {
    input = mocker.system.task();
    task = await Task.create(input);
    output = { ...input };

    url = `${baseUrl}/${task.id}`;
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
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
