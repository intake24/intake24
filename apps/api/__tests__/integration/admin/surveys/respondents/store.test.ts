import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { CustomField } from '@intake24/common/types';
import type { CreateRespondentRequest } from '@intake24/common/types/http/admin';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { Survey } from '@intake24/db';

async function assertRespondentResponse(url: string, input: CreateRespondentRequest, output: Omit<CreateRespondentRequest, 'password' | 'passwordConfirm'>) {
  const { status, body } = await request(suite.app)
    .post(url)
    .set('Accept', 'application/json')
    .set('Authorization', suite.bearer.user)
    .send(input);

  expect(status).toBe(201);

  // Extract custom fields for non-order specific comparison
  const { customFields: resCustomFields, ...data } = body;
  const { customFields: outputCustomFields, ...restOutput } = output;

  // 1) match the output
  expect(pick(data, Object.keys(restOutput))).toEqual(restOutput);

  // 2) non-order specific custom field comparison
  if (outputCustomFields) {
    const fields: CustomField[] = resCustomFields.map((field: CustomField) => pick(field, ['name', 'value', 'public']));
    expect(fields).toIncludeSameMembers(outputCustomFields);
  }
}

export default () => {
  const baseUrl = '/api/admin/surveys';
  const permissions = ['surveys', 'surveys:respondents'];

  let url: string;
  let invalidSurveyUrl: string;

  let survey: Survey;

  let input: CreateRespondentRequest;
  let output: Omit<CreateRespondentRequest, 'password' | 'passwordConfirm'>;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    const surveyInput = mocker.system.survey();
    survey = await Survey.create({
      ...surveyInput,
      userCustomFields: true,
      userPersonalIdentifiers: true,
    });

    securable = { securableId: survey.id, securableType: 'Survey' };

    url = `${baseUrl}/${survey.id}/respondents`;
    invalidSurveyUrl = `${baseUrl}/999999/respondents`;

    input = mocker.system.respondent();
    const { email, password, passwordConfirm, ...rest } = input;
    output = {
      ...rest,
      email: email ? email.toLowerCase() : undefined,
    };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidSurveyUrl, { input });
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['username']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        ['username', 'password', 'passwordConfirm', 'name', 'email', 'phone', 'customFields'],
        {
          input: {
            username: 'test-respondent@example.com',
            password: 'notacomplexpassword',
            passwordConfirm: 'notMatchingPassword',
            name: ['test respondent'],
            email: false,
            phone: [new Date()],
            customFields: 'not-a-custom-field',
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      await assertRespondentResponse(url, input, output);
    });

    it('should return 400 for duplicate username', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['username'], {
        input: { ...mocker.system.respondent(), username: input.username },
      });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['surveys']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['respondents'] });

      const input2 = mocker.system.respondent();
      const { email, password, passwordConfirm, ...rest } = input2;
      const output2 = { ...rest, email: email ? email.toLowerCase() : undefined };

      await assertRespondentResponse(url, input2, output2);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await survey.update({ ownerId: suite.data.system.user.id });

      const input3 = mocker.system.respondent();
      const { email, password, passwordConfirm, ...rest } = input3;
      const output3 = { ...rest, email: email ? email.toLowerCase() : undefined };

      await assertRespondentResponse(url, input3, output3);
    });
  });

  describe('respondent-related survey settings', () => {
    it('should not persist user PID information when disabled in survey settings', async () => {
      await survey.update({ userCustomFields: true, userPersonalIdentifiers: false });

      const { body, status } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(mocker.system.respondent());

      expect(status).toBe(201);
      expect(body.email).toBeNull();
      expect(body.name).toBeNull();
      expect(body.phone).toBeNull();
    });

    it('should not persist user custom fields when disabled in survey settings', async () => {
      await survey.update({ userCustomFields: false, userPersonalIdentifiers: true });

      const { body, status } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(mocker.system.respondent());

      expect(status).toBe(201);
      expect(body.customFields).toBeEmpty();
    });
  });
};
