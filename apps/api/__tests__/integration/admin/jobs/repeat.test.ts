import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Job } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/jobs';
  const permissions = ['jobs', 'jobs:edit'];

  let url: string;
  let invalidUrl: string;

  let job: Job;

  beforeAll(async () => {
    job = await Job.create(mocker.system.job());

    url = `${baseUrl}/${job.id}/repeat`;
    invalidUrl = `${baseUrl}/999999/repeat`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['params.store'],
        {
          input: {
            type: job.type,
            params: {
              store: 'invalid',
            },
          },
        },
      );
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertAcknowledged('post', url, { result: true });
    });
  });
};
