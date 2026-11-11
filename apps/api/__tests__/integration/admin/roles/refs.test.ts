import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/roles/refs';
  const permissions = ['acl', 'roles:browse'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  it('should return 200 and refs', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertReferencesResult('get', url, ['permissions']);
  });
};
