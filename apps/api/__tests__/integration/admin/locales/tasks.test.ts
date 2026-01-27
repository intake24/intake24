import type { QueueJob } from '@intake24/common/types';

import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FoodsLocale, SystemLocale } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:tasks'];

  let url: string;
  let invalidUrl: string;
  let sourceLocaleId: string;

  let input: Omit<QueueJob, 'userId'>;

  beforeAll(async () => {
    sourceLocaleId = suite.data.system.Locale.id;
    const { code } = suite.data.system.Language;

    const localeInput = mocker.system.locale(code, code);

    const [locale] = await Promise.all([
      SystemLocale.create(localeInput),
      FoodsLocale.create({ ...localeInput, id: localeInput.code }),
    ]);

    input = {
      type: 'LocaleCopy',
      params: { localeId: locale.id, sourceLocaleId, subTasks: ['brands'] },
    };

    url = `${baseUrl}/${locale.id}/tasks`;
    invalidUrl = `${baseUrl}/999999/tasks`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['type']);
    });

    it('should return 400 for invalid input data #1', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['type'], {
        input: { type: 'invalidJobType', params: { surveyId: 'demo', nonValidKey: false } },
      });
    });

    it('should return 400 for invalid input data #2', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['params.localeId', 'params.sourceLocaleId', 'params.subTasks'], {
        input: { type: 'LocaleCopy', params: { nonValidKey: false, subTasks: {} } },
      });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('post', invalidUrl, { input });
    });

    it('should return 200 and job resource', async () => {
      await suite.util.setPermission(permissions);

      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(200);
      expect(body.type).toBe(input.type);
    });
  });
};
