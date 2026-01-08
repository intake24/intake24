import { pick } from 'lodash-es';
import request from 'supertest';
import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { SurveyCreateRequest, SurveyEntry } from '@intake24/common/types/http/admin';

export default () => {
  const url = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:create'];

  let input: SurveyCreateRequest;
  let output: Partial<SurveyEntry>;

  beforeAll(async () => {
    input = mocker.system.survey();
    output = {
      ...input,
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
      supportEmail: input.supportEmail.toLowerCase(),
      userCustomFields: false,
      userPersonalIdentifiers: false,
    };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, [
        'slug',
        'name',
        'state',
        'startDate',
        'endDate',
        'surveySchemeId',
        'localeId',
        'supportEmail',
        'allowGenUsers',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        slug: null,
        name: [2, 0],
        state: 10,
        startDate: 'notValidDate',
        endDate: 100,
        surveySchemeId: false,
        locale: 10,
        supportEmail: 'thisIsNotValidEmail',
        allowGenUsers: 'no',
        numberOfSubmissionsForFeedback: 'number',
        session: [],
        maximumDailySubmissions: 'NaN',
        minimumSubmissionInterval: { nan: 5 },
        notifications: ['invalid-notification'],
        authCaptcha: [0],
        authUrlTokenCharset: 'abcabc',
        authUrlTokenLength: 'this is not a number',
        searchSettings: {
          collectData: '20',
          maxResults: 1000,
          sortingAlgorithm: 'invalid-search-algorithm',
          matchScoreWeight: 500,
          minWordLength1: 18,
          minWordLength2: -3.141592,
          spellingCorrectionPreference: 123,
          enableEditDistance: 'no',
          enablePhonetic: ['yes'],
          minWordLengthPhonetic: 'bazillion',
          firstWordCost: 40,
          wordOrderCost: -5,
          wordDistanceCost: '18',
          unmatchedWordCost: -10.5,
          enableRelevantCategories: 'nope',
          relevantCategoryDepth: 10,
        },
        surveySchemeOverrides: {
          meals: ['shouldBeProperlyFormatMealList'],
          prompts: 'invalidPrompts',
        },
      };

      const fields = [
        'slug',
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
        'notifications.0',
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
      ];

      await suite.sharedTests.assertInvalidInput('post', url, fields, { input: invalidInput, log: true });
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(pick(body, Object.keys(output))).toEqual(output);
      expect(body.ownerId).toBe(suite.data.system.user.id);
      expect(status).toBe(201);
    });

    it('should return 400 for duplicate slug', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['slug'], {
        input: { ...mocker.system.survey(), slug: input.slug },
      });
    });

    it('should return 400 for duplicate name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], {
        input: { ...mocker.system.survey(), name: input.name },
      });
    });
  });
};
