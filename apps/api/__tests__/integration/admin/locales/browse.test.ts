import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { SystemLocale } from '@intake24/db';

export default () => {
  const url = '/api/admin/locales';
  const permissions = ['locales', 'locales:browse'];

  let systemLocale: SystemLocale;

  beforeAll(async () => {
    const { code } = suite.data.system.Language;
    const input = mocker.system.locale(code, code);

    systemLocale = await SystemLocale.create(input);
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  describe('authenticated / resource authorized', () => {
    it('should return 200 and paginated results', async () => {
      await suite.util.setPermission(permissions);

      await suite.sharedTests.assertPaginatedResult('get', url, { result: true });
    });

    it('should return 200 and empty paginated results', async () => {
      await suite.util.setPermission('locales');

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });

    it('should return 200 and with record access', async () => {
      await suite.util.setSecurable({
        securableId: systemLocale.id,
        securableType: 'Locale',
        action: ['read'],
      });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: systemLocale.id });
    });
  });
};
