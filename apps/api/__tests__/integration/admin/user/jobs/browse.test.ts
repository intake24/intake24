import type { QueueJob } from '@intake24/common/types';
import type { Job } from '@intake24/db';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/user/jobs';
  let input: Omit<QueueJob, 'userId' | 'params'> & {
    params: { surveyId: string; startDate: string; endDate: string };
  };

  beforeAll(async () => {
    const { id, startDate, endDate } = suite.data.system.Survey;
    input = {
      type: 'SurveyDataExport',
      params: {
        surveyId: id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  });

  it('missing authentication', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it('should return 200 and data list', async () => {
    // Admin user job
    await request(suite.app)
      .post(`/api/admin/surveys/${suite.data.system.Survey.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.superuser)
      .send(input);

    // Test user job
    await suite.util.setPermission(['surveys', 'surveys:tasks']);
    await request(suite.app)
      .post(`/api/admin/surveys/${suite.data.system.Survey.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .send(input);

    await suite.util.setPermission([]);

    const { status, body } = await request(suite.app)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user);

    expect(status).toBe(200);
    expect(body).toContainAllKeys(['data', 'meta']);
    expect(body.data).toBeArray();
    expect(body.data).not.toBeEmpty();

    // Expect to only find test user's jobs
    const match = body.data.find((item: Job) => item.userId !== suite.data.system.user.id);
    expect(match).toBeUndefined();
  });
};
