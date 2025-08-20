import { randomUUID } from 'node:crypto';

import { suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyState } from '@intake24/common/surveys';
import { UserSurveySession } from '@intake24/db';
import type { UserSurveySessionCreationAttributes } from '@intake24/db';

export default () => {
  let url: string;
  let invalidUrl: string;

  let input: UserSurveySessionCreationAttributes;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/session`;
    invalidUrl = `/api/surveys/invalid-survey/session`;

    const sessionData: SurveyState = {
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

    input = {
      id: sessionData.uxSessionId,
      surveyId: suite.data.system.Survey.id,
      userId: suite.data.system.respondent.userId,
      sessionData,
    };

    await UserSurveySession.destroy({ where: { surveyId: suite.data.system.Survey.id, userId: suite.data.system.respondent.userId } });
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('delete', url);
  });

  it(`should return 403 when survey record (+survey permissions) doesn't exist`, async () => {
    await suite.sharedTests.assertMissingAuthorization('delete', invalidUrl, { bearer: 'respondent' });
  });

  it('should return 204 and no content', async () => {
    await UserSurveySession.create(input);

    await suite.sharedTests.assertRecordDeleted('delete', url, { bearer: 'respondent' });
  });
};
