import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/images/drinkware-sets';
  const permissions = ['drinkware-sets:browse'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  it('should return 200 and paginated results', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
  });
};
