import { randomUUID } from 'node:crypto';

import { pick } from 'lodash';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { UserSurveySessionCreationAttributes } from '@intake24/db';
import { UserSurveySession } from '@intake24/db';

export default () => {
  let url: string;
  let invalidUrl: string;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/session`;
    invalidUrl = `/api/surveys/invalid-survey/session`;
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('get', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('get', invalidUrl, {
      bearer: 'respondent',
    });
  });

  it(`should return 403 when user session disabled`, async () => {
    await suite.data.system.Survey.update({ session: { store: false, age: '12h', fixed: '1d+0h' } });

    await suite.sharedTests.assertMissingAuthorization('get', url, {
      bearer: 'respondent',
    });
  });

  describe('user session enabled', () => {
    beforeAll(async () => {
      await suite.data.system.Survey.update({ session: { store: true, age: '12h', fixed: '1d+0h' } });
    });

    it(`should return 404 when no survey session data`, async () => {
      const { status } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.respondent);

      expect(status).toBe(404);
    });

    it('should return 200 and survey session data', async () => {
      const { userId } = suite.data.system.respondent;
      const surveyId = suite.data.system.Survey.id;
      const id = randomUUID();

      const input: UserSurveySessionCreationAttributes = {
        id,
        userId,
        surveyId,
        sessionData: {
          schemeId: 'SurveyState',
          recallDate: new Date().toISOString().substring(0, 10),
          startTime: new Date(),
          endTime: new Date(),
          submissionTime: null,
          uxSessionId: id,
          flags: [],
          meals: [],
          customPromptAnswers: {},
          selection: { element: null, mode: 'auto' },
          wakeUpTime: null,
          sleepTime: null,
        },
      };
      await UserSurveySession.create(input);

      const { status, body } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.respondent);

      expect(status).toBe(200);
      expect(pick(body, Object.keys(input))).toEqual({
        ...input,
        sessionData: {
          ...input.sessionData,
          startTime: input.sessionData.startTime?.toISOString(),
          endTime: input.sessionData.endTime?.toISOString(),
        },
      });
    });
  });
};
