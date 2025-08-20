import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { JobAttributes } from '@intake24/common/types/http/admin';

export default () => {
  const baseUrl = '/api/admin/jobs';
  const permissions = ['jobs', 'jobs:delete'];

  let url: string;
  let invalidUrl: string;

  let job: JobAttributes;

  beforeAll(async () => {
    const { id, startDate, endDate } = suite.data.system.Survey;
    const input = {
      type: 'SurveyDataExport',
      params: {
        surveyId: id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };

    const { body } = await request(suite.app)
      .post(`/api/admin/surveys/${suite.data.system.Survey.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send(input);

    job = body;

    url = `${baseUrl}/${job.id}`;
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
