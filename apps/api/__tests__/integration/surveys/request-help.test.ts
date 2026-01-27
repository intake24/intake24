import type { SurveyHelpRequest } from '@intake24/common/types/http';

import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  let url: string;
  let invalidUrl: string;

  let input: SurveyHelpRequest;

  beforeAll(async () => {
    url = `/api/surveys/${suite.data.system.Survey.slug}/request-help`;
    invalidUrl = `/api/surveys/invalid-survey/request-help`;

    input = {
      name: 'John',
      email: 'test@example.com',
      phone: '01234 567 890',
      phoneCountry: 'GB',
      message: 'Help me!',
    };
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
    await suite.sharedTests.assertInvalidInput('post', url, ['name', 'message', 'email', 'phone'], {
      bearer: 'respondent',
    });
  });

  it('should return 400 when both email and phone empty', async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['email', 'phone'], {
      bearer: 'respondent',
      input: { name: 'John', message: 'Hello', email: null, phone: null },
    });
  });

  it('should return 400 for invalid input data', async () => {
    await suite.sharedTests.assertInvalidInput(
      'post',
      url,
      ['name', 'email', 'phoneCountry'],
      {
        bearer: 'respondent',
        input: {
          name: [],
          email: 'notAnEmailAddress',
          phone: 'notAPhoneNumber',
          phoneCountry: 'notCountryCode',
        },
      },
    );
  });

  it('should return 400 for invalid input data (phone)', async () => {
    await suite.sharedTests.assertInvalidInput(
      'post',
      url,
      ['phone'],
      {
        bearer: 'respondent',
        input: {
          name: 'John',
          email: 'test@example.com',
          phone: 'notAPhoneNumber',
          phoneCountry: 'GB',
        },
      },
    );
  });

  it('should return 200 | email & phone', async () => {
    await suite.sharedTests.assertAcknowledged('post', url, { bearer: 'respondent', input });
  });

  it('should return 200 | email only', async () => {
    await suite.sharedTests.assertAcknowledged('post', url, {
      bearer: 'respondent',
      input: { name: 'John', email: 'test@example.com', message: 'Help me!' },
    });
  });

  it('should return 200 | phone only', async () => {
    await suite.sharedTests.assertAcknowledged('post', url, {
      bearer: 'respondent',
      input: { name: 'John', phone: '+44 1234 567 890', phoneCountry: 'GB', message: 'Help me!' },
    });
  });
};
