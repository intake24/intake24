import { randomUUID } from 'node:crypto';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyState } from '@intake24/common/surveys';
import { UserSurveySession } from '@intake24/db';

export default () => {
  let url: string;
  let invalidUrl: string;

  let input: { session: SurveyState };

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/session`;
    invalidUrl = `/api/surveys/invalid-survey/session`;

    const session: SurveyState = {
      schemeId: 'schemeId',
      recallDate: null,
      startTime: new Date(),
      endTime: new Date(),
      submissionTime: null,
      uxSessionId: randomUUID(),
      flags: ['prompt-1-acknowledged', 'prompt-2-acknowledged'],
      customPromptAnswers: {},
      selection: {
        element: null,
        mode: 'auto',
      },
      meals: [],
      wakeUpTime: null,
      sleepTime: null,
    };

    input = { session };
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('post', invalidUrl, {
      bearer: 'respondent',
    });
  });

  it('should return 400 for missing input data', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['session'], {
      bearer: 'respondent',
    });
  });

  it('should return 400 for invalid input data', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['session'], {
      bearer: 'respondent',
      input: { session: 'InvalidSurveyState' },
    });
  });

  it(`should return 200 & not save session when server user session disabled`, async () => {
    await suite.data.system.Survey.update({ session: { store: false, age: '12h', fixed: '1d+0h' } });

    await suite.sharedTests.assertAcknowledged('post', url, { bearer: 'respondent', input });
    const session = await UserSurveySession.findOne({ where: { surveyId: suite.data.system.Survey.id, userId: suite.data.system.respondent.userId } });

    expect(session).toBeNull();
  });

  it('should return 200 & save session when server user session disabled', async () => {
    await Promise.all([
      suite.data.system.Survey.update({ session: { store: true, age: '12h', fixed: '1d+0h' } }),
      UserSurveySession.destroy({ where: { surveyId: suite.data.system.Survey.id, userId: suite.data.system.respondent.userId } }),
    ]);

    await suite.sharedTests.assertAcknowledged('post', url, { bearer: 'respondent', input });
    const session = await UserSurveySession.findOne({ where: { surveyId: suite.data.system.Survey.id, userId: suite.data.system.respondent.userId } });

    expect(session).not.toBeNull();
  });
};
