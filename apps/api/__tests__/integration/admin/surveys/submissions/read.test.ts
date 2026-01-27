import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { SurveySubmissionCreationAttributes } from '@intake24/db';

import { randomUUID } from 'node:crypto';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey, SurveySubmission } from '@intake24/db';

interface SurveyOutput
  extends Omit<SurveySubmissionCreationAttributes, 'startTime' | 'endTime' | 'submissionTime'> {
  startTime: string;
  endTime: string;
  submissionTime: string;
}

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:submissions'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidRespondentUrl: string;

  let survey: Survey;

  let input: SurveySubmissionCreationAttributes;
  let output: SurveyOutput;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);

    securable = { securableId: survey.id, securableType: 'Survey' };

    const respondent = await ioc.cradle.adminSurveyService.createRespondent(
      survey.id,
      mocker.system.respondent(),
    );

    input = mocker.system.submission(survey.id, respondent.userId);
    output = {
      ...input,
      startTime: input.startTime.toISOString(),
      endTime: input.endTime.toISOString(),
      submissionTime: input.submissionTime.toISOString(),
    };
    const submission = await SurveySubmission.create(input);

    url = `${baseUrl}/${survey.id}/submissions/${submission.id}`;
    invalidSurveyUrl = `${baseUrl}/999999/submissions/${submission.id}`;
    invalidRespondentUrl = `${baseUrl}/${survey.id}/submissions/${randomUUID()}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidSurveyUrl);
    });

    it(`should return 404 when submission record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidRespondentUrl);
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['submissions'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
