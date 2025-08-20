import { randomUUID } from 'node:crypto';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyState } from '@intake24/common/surveys';

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
    await suite.sharedTests.assertMissingAuthentication('put', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('put', invalidUrl, {
      bearer: 'respondent',
    });
  });

  it(`should return 403 when user session disabled`, async () => {
    await suite.data.system.Survey.update({ session: { store: false, age: '12h', fixed: '1d+0h' } });

    await suite.sharedTests.assertMissingAuthorization('put', url, {
      bearer: 'respondent',
      input,
    });
  });

  describe('user session enabled', () => {
    beforeAll(async () => {
      await suite.data.system.Survey.update({ session: { store: true, age: '12h', fixed: '1d+0h' } });
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['session'], {
        bearer: 'respondent',
      });
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['session'], {
        bearer: 'respondent',
        input: { session: 'InvalidSurveyState' },
      });
    });

    it('should return 200', async () => {
      await suite.sharedTests.assertAcknowledged('put', url, { bearer: 'respondent', input });
    });
  });
};
