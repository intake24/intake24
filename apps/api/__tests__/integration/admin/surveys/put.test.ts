import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyCreationAttributes } from '@intake24/db';
import { Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';

  let url: string;
  let invalidUrl: string;

  let input: SurveyCreationAttributes;
  let updateInput: SurveyCreationAttributes;
  let output: SurveyCreationAttributes;
  let survey: Survey;

  beforeAll(async () => {
    input = mocker.system.survey();
    updateInput = mocker.system.survey();

    const { slug } = input;
    output = { ...updateInput, slug, supportEmail: updateInput.supportEmail.toLowerCase() };

    survey = await Survey.create(input);

    url = `${baseUrl}/${survey.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url);
  });

  it('should return 403 when missing survey-specific permission', async () => {
    await suite.util.setPermission('surveys:edit');

    await suite.sharedTests.assertMissingAuthorization('put', url);
  });

  it(`should return 403 when missing 'surveys-edit' permission (surveyadmin)`, async () => {
    await suite.util.setPermission('surveyadmin');

    await suite.sharedTests.assertMissingAuthorization('put', url);
  });

  it(`should return 403 when missing surveyadmin`, async () => {
    // await suite.util.setPermission(['surveys:edit', surveyStaff(survey.id)]);

    await suite.sharedTests.assertMissingAuthorization('put', url);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys:edit', 'surveyadmin']);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, [
        'name',
        'state',
        'startDate',
        'endDate',
        'surveySchemeId',
        'localeId',
        'supportEmail',
        'allowGenUsers',
        'surveySchemeOverrides',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: { name: 'survey name' },
        state: 10,
        startDate: 'notValidDate',
        endDate: 100,
        surveySchemeId: '999999',
        localeId: 10,
        supportEmail: 'thisIsNotValidEmail',
        allowGenUsers: 'no',
        numberOfSubmissionsForFeedback: 'number',
        maximumDailySubmissions: 'NaN',
        minimumSubmissionInterval: { nan: 5 },
        authCaptcha: 1,
        authModes: 'invalidMode',
        authUrlTokenCharset: ['an array charset'],
        authUrlTokenLength: 1,
        searchSortingAlgorithm: false,
        searchMatchScoreWeight: { number: 20 },
        surveySchemeOverrides: {
          meals: ['shouldBeProperlyFormatMealList'],
          prompts: { value: 'not a valid overrides object' },
        },
        userPersonalIdentifiers: [true],
        userCustomFields: 'not a boolean',
      };

      const fields = [
        'name',
        'state',
        'startDate',
        'endDate',
        'surveySchemeId',
        'localeId',
        'supportEmail',
        'allowGenUsers',
        'numberOfSubmissionsForFeedback',
        'maximumDailySubmissions',
        'minimumSubmissionInterval',
        'authCaptcha',
        'authModes',
        'authUrlTokenCharset',
        'authUrlTokenLength',
        'searchSortingAlgorithm',
        'searchMatchScoreWeight',
        'surveySchemeOverrides',
        'userPersonalIdentifiers',
        'userCustomFields',
      ];

      await suite.sharedTests.assertInvalidInput('put', url, fields, { input: invalidInput });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, output, { input: updateInput });
    });
  });
};
