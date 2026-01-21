import request from 'supertest';

import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { QueueJob } from '@intake24/common/types';
import { Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:tasks'];

  let input: Omit<QueueJob, 'userId' | 'params'> & {
    params: { surveyId: string; startDate: string; endDate: string };
  };
  let survey: Survey;

  let url: string;
  let invalidUrl: string;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);
    const { id, startDate, endDate } = survey;

    input = {
      type: 'SurveyDataExport',
      params: {
        surveyId: id,
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!,
      },
    };

    securable = { securableId: id, securableType: 'Survey' };

    url = `${baseUrl}/${id}/tasks`;
    invalidUrl = `${baseUrl}/999999/tasks`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, { input });
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['type'], {
        input: {
          type: 'invalidType',
          params: { startDate: 'notValidDate', endDate: 100 },
        },
      });
    });

    it('should return 200 and job resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(200);
      expect(body).not.toBeEmpty();
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['tasks'] });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(200);
      expect(body).not.toBeEmpty();
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(200);
      expect(body).not.toBeEmpty();
    });
  });
};
