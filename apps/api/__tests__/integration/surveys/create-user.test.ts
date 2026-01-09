import jwt from 'jsonwebtoken';
import { omit, pick } from 'lodash-es';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

const keys = (payload: object, omitFields: string[] = []) => ['userId', 'authToken', ...Object.keys(omit(payload, ['password', ...omitFields]))];

export default () => {
  let url: string;
  let invalidUrl: string;

  let payload: { username: string; redirectUrl?: string };
  const secret = 'aSuperSecret';
  let token: string;

  beforeAll(async () => {
    payload = { username: 'userIdentifier001', redirectUrl: 'https://redirect-me.here' };
    token = jwt.sign(payload, secret, { expiresIn: '15m' });

    url = `/api/surveys/${suite.data.system.Survey.slug}/create-user`;
    invalidUrl = `/api/surveys/invalid-survey/create-user`;
  });

  it(`should return 400 for missing JWT in query token`, async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['token'], {
      bearer: null,
    });
  });

  it(`should return 400 for malformed JWT in query token`, async () => {
    await suite.sharedTests.assertInvalidInput('post', url, ['token'], {
      bearer: null,
      input: { token: 'this-is-not-a-jwt-token' },
    });
  });

  it(`should return 404 when record doesn't exist`, async () => {
    await suite.sharedTests.assertMissingRecord('post', invalidUrl, {
      bearer: null,
      input: { token },
    });
  });

  it(`should return 403 when user generation disabled`, async () => {
    await suite.data.system.Survey.update({ allowGenUsers: false, genUserKey: null });

    await suite.sharedTests.assertMissingAuthorization('post', url, {
      bearer: null,
      input: { token },
    });
  });

  it(`should return 403 when JWT secret is not set in survey settings`, async () => {
    await suite.data.system.Survey.update({ allowGenUsers: true, genUserKey: null });

    await suite.sharedTests.assertMissingAuthorization('post', url, {
      bearer: null,
      input: { token },
    });
  });

  describe('for correct survey settings', () => {
    beforeAll(async () => {
      await suite.data.system.Survey.update({
        allowGenUsers: true,
        genUserKey: secret,
        userCustomFields: false,
        userPersonalIdentifiers: false,
      });
    });

    it(`should return 403 for invalid JWT secret`, async () => {
      const invalidToken = jwt.sign(payload, 'invalidSecret', { expiresIn: '5m' });

      await suite.sharedTests.assertMissingAuthorization('post', url, {
        bearer: null,
        input: { token: invalidToken },
      });
    });

    it(`should return 400 when payload is not an object`, async () => {
      const nonObjectToken = jwt.sign('notAnObjectPayload', secret);

      const { status } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token: nonObjectToken });

      expect(status).toBe(400);
    });

    it(`should return 400 when missing claim (username)`, async () => {
      const { username, ...rest } = payload;
      await suite.sharedTests.assertInvalidInput('post', url, ['username'], {
        input: {
          token: jwt.sign(rest, secret, { expiresIn: '5m' }),
        },
      });
    });

    it(`should return 400 for invalid input data`, async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['username', 'password', 'name', 'customFields', 'redirectUrl'], {
        input: {
          token: jwt.sign({
            username: false,
            name: ['name'],
            password: 'weak',
            redirectUrl: 'not-url',
            customFields: { field: 'value' },
          }, secret, { expiresIn: '5m' }),
        },
      });
    });

    it('should return 200 and respondent record', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload));
    });

    it('should return 200 and same respondent record, should be idempotent', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload));
    });

    it('should return 200 and respondent record (with password)', async () => {
      const payload = {
        username: 'userIdentifier002',
        password: 'aPassword132456',
        redirectUrl: 'https://redirect-me.here',
      };
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload));
      expect(pick(body, Object.keys(payload))).toEqual(omit(payload, 'password'));
    });

    it('should return 200 and respondent record without name & custom fields', async () => {
      const payload = {
        username: 'userIdentifier003',
        password: 'aPassword132456',
        name: 'myName',
        customFields: [
          { name: 'field01', value: 'value01' },
          { name: 'field02', value: 'value02', public: true },
        ],
      };
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload, ['name', 'customFields']));
      expect(pick(body, Object.keys(payload))).toEqual(omit(payload, ['password', 'name', 'customFields']));
    });

    it('should return 200 and respondent record with name', async () => {
      await suite.data.system.Survey.update({ userCustomFields: false, userPersonalIdentifiers: true });

      const payload = {
        username: 'userIdentifier004',
        name: 'myName',
        customFields: [{ name: 'field01', value: 'value01' }],
      };
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload, ['customFields']));
      expect(pick(body, Object.keys(payload))).toEqual(omit(payload, ['customFields']));
    });

    it('should return 200 and respondent record with custom fields', async () => {
      await suite.data.system.Survey.update({ userCustomFields: true, userPersonalIdentifiers: false });

      const payload = {
        username: 'userIdentifier005',
        name: 'myName',
        customFields: [{ name: 'field01', value: 'value01' }],
      };
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .send({ token });

      expect(status).toBe(200);
      expect(body).toContainAllKeys(keys(payload, ['name']));
      expect(pick(body, Object.keys(payload))).toEqual(omit(payload, ['name']));
    });
  });
};
