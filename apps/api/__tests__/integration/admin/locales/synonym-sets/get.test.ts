import type { SynonymSetRequest } from '@intake24/common/types/http/admin';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';

export default () => {
  const baseUrl = '/api/admin/locales';
  const permissions = ['locales', 'locales:synonym-sets'];

  let url: string;
  let invalidUrl: string;

  let synonymSets: SynonymSetRequest[];

  beforeAll(async () => {
    const { id, code: localeId } = suite.data.system.Locale;

    synonymSets = [
      { localeId, synonyms: 'synonym1 synonym2 synonym3' },
      { localeId, synonyms: 'synonym11 synonym22 synonym33' },
    ];

    await ioc.cradle.localeService.setSynonymSets(id, synonymSets);

    url = `${baseUrl}/${id}/synonym-sets`;
    invalidUrl = `${baseUrl}/999999/synonym-sets`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and records', async () => {
      await suite.util.setPermission(permissions);

      const { status, body } = await request(suite.app)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send();

      expect(status).toBe(200);
      expect(body).toBeArray();

      const lists = body.map(({ id, ...rest }: SynonymSetRequest) => rest);
      expect(lists).toIncludeSameMembers(synonymSets);
    });
  });
};
