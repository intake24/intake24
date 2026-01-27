import type { UserPhysicalDataAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { feedbackPhysicalDataFields } from '@intake24/common/feedback';
import { FeedbackScheme, PhysicalActivityLevel, Survey } from '@intake24/db';

export default () => {
  const url = '/api/user/physical-data';

  let createUserPhysicalData: Omit<UserPhysicalDataAttributes, 'userId'>;
  let updateUserPhysicalData: Omit<UserPhysicalDataAttributes, 'userId'>;

  let feedbackScheme: FeedbackScheme;
  let survey: Survey;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create(surveyInput);

    feedbackScheme = await FeedbackScheme.create(mocker.system.feedbackScheme());

    await PhysicalActivityLevel.bulkCreate([
      { name: 'test one', coefficient: 10 },
      { name: 'test two', coefficient: 100 },
    ]);

    createUserPhysicalData = {
      sex: 'm',
      weightKg: 85,
      heightCm: 182,
      physicalActivityLevelId: '1',
      birthdate: 1975,
      weightTarget: 'lose_weight',
    };

    updateUserPhysicalData = {
      sex: 'f',
      weightKg: 72,
      heightCm: 176,
      physicalActivityLevelId: '2',
      birthdate: 1981,
      weightTarget: 'keep_weight',
    };
  });

  it('should return 401 when no / invalid token', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url, { bearer: 'respondent' });
  });

  it('should return 400 for invalid input data', async () => {
    await suite.sharedTests.assertInvalidInput(
      'post',
      `${url}?survey=${survey.slug}`,
      ['sex', 'weightKg', 'heightCm', 'birthdate', 'physicalActivityLevelId', 'weightTarget'],
      {
        bearer: 'respondent',
        input: {
          sex: 'invalidGender',
          weightKg: 'notANumber',
          heightCm: ['notANumber'],
          birthdate: 'shouldBeAYear',
          physicalActivityLevelId: false,
          weightTarget: 2020,
        },
      },
    );
  });

  it('should return 404 for invalid survey', async () => {
    await suite.sharedTests.assertMissingRecord('post', `${url}?survey=nonExistingSurvey`, {
      bearer: 'respondent',
      input: createUserPhysicalData,
    });
  });

  it('should return 403 when no feedback scheme assigned', async () => {
    await suite.sharedTests.assertMissingAuthorization('post', `${url}?survey=${survey.slug}`, {
      bearer: 'respondent',
      input: createUserPhysicalData,
    });
  });

  it('should return 400 when feedback scheme specifies physicalDataFields and they are missing', async () => {
    await Promise.all([
      survey.update({ feedbackSchemeId: feedbackScheme.id }),
      feedbackScheme.update({ physicalDataFields: [...feedbackPhysicalDataFields] }),
    ]);

    await suite.sharedTests.assertInvalidInput(
      'post',
      `${url}?survey=${survey.slug}`,
      ['sex', 'weightKg', 'heightCm', 'birthdate', 'physicalActivityLevelId', 'weightTarget'],
      {
        bearer: 'respondent',
        input: {
          sex: null,
          weightKg: null,
          heightCm: null,
          birthdate: null,
          physicalActivityLevelId: null,
          weightTarget: null,
        },
      },
    );
  });

  it('should return 200 and user physical data', async () => {
    await suite.sharedTests.assertRecordUpdated(
      'post',
      `${url}?survey=${survey.slug}`,
      createUserPhysicalData,
      { bearer: 'respondent' },
    );
  });

  it('should return 200 and updated user physical data', async () => {
    await suite.sharedTests.assertRecordUpdated(
      'post',
      `${url}?survey=${survey.slug}`,
      updateUserPhysicalData,
      { bearer: 'respondent' },
    );
  });
};
