import type { TaskRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Task } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/tasks';
  const permissions = ['tasks', 'tasks:delete'];

  let url: string;
  let invalidUrl: string;

  let input: TaskRequest;
  let task: Task;

  beforeAll(async () => {
    input = mocker.system.task();
    task = await Task.create(input);

    url = `${baseUrl}/${task.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });
};
