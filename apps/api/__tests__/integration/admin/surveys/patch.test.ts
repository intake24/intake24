import { pick } from 'lodash-es';

import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyCreationAttributes } from '@intake24/db';
import { guardedSurveyFields, Survey } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:edit'];

  let url: string;
  let invalidUrl: string;

  let input: SurveyCreationAttributes;
  let updateInput: SurveyCreationAttributes;
  let survey: Survey;

  let securable: SetSecurableOptions;

  let refreshSurveyRecord: () => Omit<SurveyCreationAttributes, 'startDate' | 'endDate'> & { startDate: string; endDate: string };

  beforeAll(async () => {
    input = mocker.system.survey();
    updateInput = mocker.system.survey();

    refreshSurveyRecord = () => {
      const mock = mocker.system.survey();
      const { slug } = input;
      return {
        ...mock,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        slug,
        supportEmail: mock.supportEmail.toLowerCase(),
      };
    };

    survey = await Survey.create(input);

    securable = { securableId: survey.id, securableType: 'Survey' };

    url = `${baseUrl}/${survey.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('patch', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('patch', url, []);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: { name: 'survey name' },
        state: 10,
        startDate: 'notValidDate',
        endDate: 100,
        surveySchemeId: false,
        localeId: 10,
        supportEmail: 'thisIsNotValidEmail',
        allowGenUsers: 'no',
        numberOfSubmissionsForFeedback: 'number',
        session: 'not-a-session-settings',
        maximumDailySubmissions: 'NaN',
        minimumSubmissionInterval: { nan: 5 },
        notifications: [{ type: 'invalid' }],
        authCaptcha: 'yes',
        authUrlTokenCharset: ['an array charset'],
        authUrlTokenLength: 1,
        searchSettings: {
          collectData: [true],
          maxResults: 1000,
          matchScoreWeight: { number: 20 },
          sortingAlgorithm: false,
          minWordLength1: 'long',
          minWordLength2: -5,
          spellingCorrectionPreference: 'magic',
          enableEditDistance: 'no',
          enablePhonetic: ['x'],
          minWordLengthPhonetic: 18,
          firstWordCost: '-10',
          wordOrderCost: -5,
          wordDistanceCost: ['helicopter'],
          unmatchedWordCost: {},
          enableRelevantCategories: 'nope',
          relevantCategoryDepth: 10,
        },
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
        'session',
        'maximumDailySubmissions',
        'minimumSubmissionInterval',
        'notifications.0.channel',
        'authCaptcha',
        'authUrlTokenCharset',
        'authUrlTokenLength',
        'searchSettings.collectData',
        'searchSettings.maxResults',
        'searchSettings.matchScoreWeight',
        'searchSettings.sortingAlgorithm',
        'searchSettings.minWordLength1',
        'searchSettings.minWordLength2',
        'searchSettings.spellingCorrectionPreference',
        'searchSettings.enableEditDistance',
        'searchSettings.enablePhonetic',
        'searchSettings.minWordLengthPhonetic',
        'searchSettings.firstWordCost',
        'searchSettings.wordOrderCost',
        'searchSettings.wordDistanceCost',
        'searchSettings.unmatchedWordCost',
        'searchSettings.enableRelevantCategories',
        'searchSettings.relevantCategoryDepth',
        'surveySchemeOverrides.meals.0',
        'surveySchemeOverrides.prompts',
        'surveySchemeOverrides.settings',
        'userPersonalIdentifiers',
        'userCustomFields',
      ];

      await suite.sharedTests.assertInvalidInput('patch', url, fields, { input: invalidInput });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      const updateInput1 = refreshSurveyRecord();

      await suite.sharedTests.assertRecordUpdated('patch', url, {
        ...updateInput1,
        userCustomFields: false,
        userPersonalIdentifiers: false,
      });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    beforeEach(async () => {
      await survey.reload();
    });

    it('should return 200 and data when securable set (except guarded fields)', async () => {
      await suite.util.setSecurable({ ...securable, action: ['edit'] });

      const updateInput2 = refreshSurveyRecord();
      const guarded = pick(survey, guardedSurveyFields);

      await suite.sharedTests.assertRecordUpdated(
        'patch',
        url,
        { ...updateInput2, ...guarded },
        { input: updateInput2 },
      );
    });

    it('should return 200 and data when owner set (except guarded fields)', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const updateInput3 = refreshSurveyRecord();
      const guarded = pick(survey, guardedSurveyFields);

      await suite.sharedTests.assertRecordUpdated(
        'patch',
        url,
        { ...updateInput3, ...guarded },
        { input: updateInput3 },
      );
    });
  });
};
