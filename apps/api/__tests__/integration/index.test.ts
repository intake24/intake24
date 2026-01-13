/* eslint-disable perfectionist/sort-imports */
import '@intake24/api/bootstrap';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

// import root from './root.test';
import admin from './admin/index.test';
import authentication from './authentication/index.test';
import feedback from './feedback/index.test';
import i18n from './i18n/index.test';
import jobs from './jobs/index.test';
import password from './password/index.test';
import portionSizes from './portion-sizes/index.test';
import subscriptions from './subscriptions/index.test';
import surveys from './surveys/index.test';
import user from './user/index.test';

describe('api', () => {
  beforeAll(async () => {
    await suite.init();

    // Get access tokens for superuser, user (admin tool), respondent (survey frontend)
    const [superuserRes, userRes, respondentRes] = await Promise.all([
      request(suite.app)
        .post('/api/admin/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'testAdmin@example.com', password: 'testAdminPassword' }),
      request(suite.app)
        .post('/api/admin/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'testUser@example.com', password: 'testUserPassword' }),
      request(suite.app).post('/api/auth/login/alias').set('Accept', 'application/json').send({
        survey: 'test-survey',
        username: 'testRespondent',
        password: 'testRespondentPassword',
        captcha: 'test-captcha',
      }),
    ]);

    suite.bearer = {
      superuser: `Bearer ${superuserRes.body.accessToken}`,
      user: `Bearer ${userRes.body.accessToken}`,
      respondent: `Bearer ${respondentRes.body.accessToken}`,
    };
  });

  // describe('Root', root);

  describe('/api/auth', authentication);
  describe('/api/password', password);
  describe('/api/i18n', i18n);
  describe('/api/feedback', feedback);
  // TODO: describe('/api/foods', foods);
  describe('/api/portion-sizes', portionSizes);
  describe('/api/subscriptions', subscriptions);
  describe('/api/surveys', surveys);
  describe('/api/user', user);

  describe('/api/admin', admin);

  describe('jobs', jobs);

  afterAll(async () => {
    await suite.close();
  });
});
