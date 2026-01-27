import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { UserSurveyAlias } from '@intake24/db';

import { randomUUID } from 'node:crypto';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Survey, SurveySubmission } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:submissions'];

  let url: string;
  let invalidSurveyUrl: string;
  let invalidSubmissionUrl: string;

  let survey: Survey;
  let respondent: UserSurveyAlias;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);

    securable = { securableId: survey.id, securableType: 'Survey' };

    respondent = await ioc.cradle.adminSurveyService.createRespondent(
      survey.id,
      mocker.system.respondent(),
    );

    const submission = await SurveySubmission.create(
      mocker.system.submission(survey.id, respondent.userId),
    );

    url = `${baseUrl}/${survey.id}/submissions/${submission.id}`;
    invalidSurveyUrl = `${baseUrl}/999999/submissions/${submission.id}`;
    invalidSubmissionUrl = `${baseUrl}/${survey.id}/submissions/${randomUUID()}`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when survey record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidSurveyUrl);
    });

    it(`should return 404 when submission record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidSubmissionUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 204 and no content when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['submissions'] });

      const { id } = await SurveySubmission.create(
        mocker.system.submission(survey.id, respondent.userId),
      );

      const url2 = `${baseUrl}/${survey.id}/submissions/${id}`;

      await suite.sharedTests.assertRecordDeleted('delete', url2);
    });

    it('should return 204 and no content when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const { id } = await SurveySubmission.create(
        mocker.system.submission(survey.id, respondent.userId),
      );

      const url3 = `${baseUrl}/${survey.id}/submissions/${id}`;

      await suite.sharedTests.assertRecordDeleted('delete', url3);
    });
  });
};
