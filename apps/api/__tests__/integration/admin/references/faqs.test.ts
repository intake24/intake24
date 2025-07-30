import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/references/faqs';
  const permissions = ['faqs', 'surveys'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  for (const permission of permissions) {
    it(`should return 200 and paginated results ('${permission}')`, async () => {
      await suite.util.setPermission(permission);

      await suite.sharedTests.assertPaginatedResult('get', url);
    });
  }
};
