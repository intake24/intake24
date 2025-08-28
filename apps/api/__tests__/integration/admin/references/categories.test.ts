import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/references/categories';
  const permissions = ['locales'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  for (const permission of permissions) {
    describe('authenticated / resource authorized', () => {
      beforeAll(async () => {
        await suite.util.setPermission(permissions);
      });

      it('should return 400 for missing query data', async () => {
        await suite.sharedTests.assertInvalidInput('get', url, ['localeId']);
      });

      it(`should return 200 and paginated results ('${permission}')`, async () => {
        await suite.sharedTests.assertPaginatedResult('get', `${url}?localeId=en_GB`);
      });
    });
  }
};
